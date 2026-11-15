import type { FC } from "react";
import { Redirect, Route, Switch } from "react-router-dom";

import { ProductReviewsPage } from "./pages/ProductReviewsPage";
import { reviewListPath } from "./urls";

export const ReviewSection: FC = () => {
  return (
    <Switch>
      <Route exact path={reviewListPath} component={ProductReviewsPage} />
      <Redirect to={reviewListPath} />
    </Switch>
  );
};

export default ReviewSection;
