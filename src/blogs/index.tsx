import * as React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { BlogAuthorsPage } from "./pages/BlogAuthorsPage";
import { BlogCategoriesPage } from "./pages/BlogCategoriesPage";
import { BlogListPage } from "./pages/BlogListPage";
import { BlogPostFormPage } from "./pages/BlogPostFormPage";
import {
  blogAuthorsPath,
  blogCategoriesPath,
  blogCreatePath,
  blogEditPath,
  blogListPath,
  blogTagsPath,
} from "./urls";

export const BlogSection: React.FC = () => {
  return (
    <Switch>
      <Route exact path={blogListPath} component={BlogListPage} />
      <Route exact path={blogCreatePath} component={BlogPostFormPage} />
      <Route exact path={blogCategoriesPath} component={BlogCategoriesPage} />
      <Route exact path={blogTagsPath} component={BlogCategoriesPage} />
      <Route exact path={blogAuthorsPath} component={BlogAuthorsPage} />
      <Route path={blogEditPath(":id")} component={BlogPostFormPage} />
      <Redirect to={blogListPath} />
    </Switch>
  );
};

export default BlogSection;
