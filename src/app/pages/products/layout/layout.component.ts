import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Store } from '@ngrx/store';

import { State } from 'app/store';
import { Category, Product } from 'app/app.models';

import * as KeywordActions from 'app/store/actions/keyword.action';
import * as ProductActions from 'app/store/actions/product.action';
import * as ProductsActions from 'app/store/actions/products.action';
import * as CategoryActions from 'app/store/actions/category.action';
import * as CrumbpathActions from 'app/store/actions/crumb-path.action';

@Component({
  selector: 'app-products-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {

  parentCategory: Category;
  category: Category;
  product:  Product;
  categories: Category[];
  subscriptions: Subscription[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store<State>) { }

  ngOnInit() {

    this.subscriptions = [
      this.store
        .select(state => state.category)
        .subscribe(data => this.parentCategory = data.category),

    this.store
        .select(state => state.product)
        .subscribe(data => {

          this.product = data.product;

          if ( this.product && this.product.crumbPath ) {

            this.product.crumbPath.push({ name: this.product.name, id: this.product.id });
            this.store.dispatch( new CrumbpathActions.SaveCrumbPath(this.product.crumbPath));
          }
        }),

    this.store
        .select(state => state.categories)
        .pipe(
          switchMap(res => {
            this.categories = res.categories;
            return this.route.url;
          })
        )
        .subscribe(() => {
            if (this.router.url === '/products') {
              this.category = {id: 0, name: '', crumbPath: [], parentId: 0, permalink: '', hasSubCategory: true};
            } else {
              this.category = this.categories.find((c) => c.permalink === `${this.router.url}/`);
              this.store.dispatch( new KeywordActions.SetKeyword(''));
            }
            if (this.category) {
              this.store.dispatch(new CategoryActions.SaveCategory(this.category));
              this.store.dispatch(new ProductActions.RemoveProduct());
              this.store.dispatch(new CrumbpathActions.SaveCrumbPath(this.category.crumbPath));
            } else if (!this.category) {
              const payload = { permalink: this.router.url, categoryId: this.parentCategory ? this.parentCategory.id : null };
              this.store.dispatch( new ProductActions.GetProduct(payload));
              this.store.dispatch( new CategoryActions.RemoveCategory());
              this.store.dispatch( new ProductsActions.ModeProducts('related'));
            }
        })
    ];
  }

  ngOnDestroy() {
    this.subscriptions.forEach( subscription => subscription.unsubscribe() );
  }

}
