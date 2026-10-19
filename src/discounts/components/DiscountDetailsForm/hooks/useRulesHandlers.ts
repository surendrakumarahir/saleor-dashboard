import { mapAPIRuleToForm, type Rule } from "@dashboard/discounts/models";
import { sortRules } from "@dashboard/discounts/utils";
import {
  type PromotionDetailsFragment,
  type PromotionRuleCreateErrorFragment,
  type PromotionRuleUpdateErrorFragment,
} from "@dashboard/graphql";
import { type CommonError } from "@dashboard/utils/errors/common";
import { useEffect, useState } from "react";

import { getCurrentConditionsValuesLabels, getCurrentConditionsValuesThumbnails } from "../utils";

interface UseRulesHandlersProps {
  data: PromotionDetailsFragment | undefined | null;
  ruleConditionsOptionsDetailsMap: Record<string, string>;
  ruleConditionsOptionsThumbnailsMap?: Record<string, string>;
  giftsOptionsDetailsMap: Record<string, string>;
  onRuleUpdateSubmit: (data: Rule) => Promise<Array<CommonError<PromotionRuleUpdateErrorFragment>>>;
  onRuleCreateSubmit: (data: Rule) => Promise<Array<CommonError<PromotionRuleCreateErrorFragment>>>;
  onRuleDeleteSubmit: (id: string) => void;
}

export const useRulesHandlers = ({
  data,
  ruleConditionsOptionsDetailsMap,
  ruleConditionsOptionsThumbnailsMap,
  giftsOptionsDetailsMap,
  onRuleUpdateSubmit,
  onRuleCreateSubmit,
  onRuleDeleteSubmit,
}: UseRulesHandlersProps) => {
  const [rulesErrors, setRulesErrors] = useState<Array<CommonError<any>>>([]);
  const [conditionValuesLabelMap, setConditionValuesLabelMap] = useState<Record<string, string>>(
    {},
  );
  const [conditionValuesThumbnailMap, setConditionValuesThumbnailMap] = useState<
    Record<string, string>
  >({});
  const rules = sortRules(
    data?.rules?.map(rule =>
      mapAPIRuleToForm(data?.type, rule, {
        conditionsValues: conditionValuesLabelMap,
        conditionsThumbnails: conditionValuesThumbnailMap,
        gifts: giftsOptionsDetailsMap,
      }),
    ) ?? [],
  );

  useEffect(() => {
    setConditionValuesLabelMap(labels => {
      return {
        ...ruleConditionsOptionsDetailsMap,
        ...labels,
      };
    });
  }, [ruleConditionsOptionsDetailsMap]);

  useEffect(() => {
    if (ruleConditionsOptionsThumbnailsMap) {
      setConditionValuesThumbnailMap(prev => ({
        ...ruleConditionsOptionsThumbnailsMap,
        ...prev,
      }));
    }
  }, [ruleConditionsOptionsThumbnailsMap]);

  const updateLabels = (rule: Rule) => {
    setConditionValuesLabelMap(labels => ({
      ...labels,
      ...getCurrentConditionsValuesLabels([rule]),
    }));
    setConditionValuesThumbnailMap(prev => ({
      ...prev,
      ...getCurrentConditionsValuesThumbnails([rule]),
    }));
  };
  const onRuleSubmit = async (rule: Rule, ruleEditIndex: number | null) => {
    let errors: Array<
      CommonError<PromotionRuleUpdateErrorFragment | PromotionRuleCreateErrorFragment>
    > = [];

    updateLabels(rule);

    if (ruleEditIndex !== null) {
      errors = await onRuleUpdateSubmit(rule);

      if (errors.length > 0) {
        setRulesErrors(errors);
      }
    } else {
      errors = await onRuleCreateSubmit(rule);

      if (errors.length > 0) {
        setRulesErrors(errors);
      }
    }
  };
  const onDeleteRule = async (ruleDeleteIndex: number) => {
    if (ruleDeleteIndex === null) {
      return;
    }

    const ruleId = rules[ruleDeleteIndex].id;

    if (!ruleId) {
      return;
    }

    await onRuleDeleteSubmit(ruleId);
  };

  return {
    rulesErrors,
    rules,
    onDeleteRule,
    onRuleSubmit,
  };
};
