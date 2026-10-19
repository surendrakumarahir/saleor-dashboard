import { type PromotionDetailsQuery } from "@dashboard/graphql";
import { type ReactNode } from "react";

import {
  getRuleConditionsOptionsDetailsMap,
  getRuleConditionsOptionsThumbnailsMap,
  useFetchConditionsOptionsDetails,
} from "../hooks/useFetchConditionsOptionsDetails";
import { useFetchGiftLables } from "../hooks/useFetchGiftLables";
import { labelsMapsContext } from "./context";

interface LabelsMapsProoviderProps {
  children: React.ReactNode;
  promotionData: PromotionDetailsQuery | undefined;
}

export const LabelsMapsProvider = ({ children, promotionData }: LabelsMapsProoviderProps) => {
  const { ruleConditionsOptionsDetails, ruleConditionsOptionsDetailsLoading } =
    useFetchConditionsOptionsDetails(promotionData);
  const ruleConditionsOptionsDetailsMap = getRuleConditionsOptionsDetailsMap(
    ruleConditionsOptionsDetails,
  );
  const ruleConditionsOptionsThumbnailsMap = getRuleConditionsOptionsThumbnailsMap(
    ruleConditionsOptionsDetails,
  );
  const { giftsLabels, loading: giftsLabelsLoading } = useFetchGiftLables(promotionData);
  const contextValue = {
    ruleConditionsValues: {
      labels: ruleConditionsOptionsDetailsMap,
      thumbnails: ruleConditionsOptionsThumbnailsMap,
      loading: ruleConditionsOptionsDetailsLoading,
    },
    gifts: {
      labels: giftsLabels,
      loading: giftsLabelsLoading,
    },
  };

  return <labelsMapsContext.Provider value={contextValue}>{children}</labelsMapsContext.Provider>;
};

export const EmpptyLabelsMapsProvider = ({ children }: { children: ReactNode }) => {
  return (
    <labelsMapsContext.Provider
      value={{
        ruleConditionsValues: {
          labels: {},
          loading: false,
        },
        gifts: {
          labels: {},
          loading: false,
        },
      }}
    >
      {children}
    </labelsMapsContext.Provider>
  );
};
