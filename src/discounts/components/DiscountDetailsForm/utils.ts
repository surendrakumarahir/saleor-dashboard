import { isArrayOfOptions, type Rule } from "@dashboard/discounts/models";
import { type Option } from "@saleor/macaw-ui-next";

export const getCurrentConditionsValuesLabels = (rule: Rule[]) => {
  return rule
    .flatMap(rule => rule.conditions)
    .filter(condition => isArrayOfOptions(condition.value))
    .flatMap(condition => condition.value as Option[])
    .reduce(
      (acc, value) => {
        // Initali value and label might contain  id
        if (value.value !== value.label) {
          acc[value.value] = value.label;
        }

        return acc;
      },
      {} as Record<string, string>,
    );
};

export const getCurrentConditionsValuesThumbnails = (rule: Rule[]) => {
  return rule
    .flatMap(rule => rule.conditions)
    .filter(condition => isArrayOfOptions(condition.value))
    .flatMap(condition => condition.value as Array<Option & { thumbnail?: string }>)
    .reduce(
      (acc, value) => {
        if (value.thumbnail) {
          acc[value.value] = value.thumbnail;
        }

        return acc;
      },
      {} as Record<string, string>,
    );
};
