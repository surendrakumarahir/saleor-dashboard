import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { useDiscountRulesContext } from "@dashboard/discounts/components/DiscountRules/context";
import { type Condition, type Rule } from "@dashboard/discounts/models";
import { Box, Button } from "@saleor/macaw-ui-next";
import { Minus } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { RuleConditionName } from "../RuleConditionName/";
import { RuleConditionSelectedProducts } from "../RuleConditionSelectedProducts";
import { RuleConditionType } from "../RuleConditionType/";
import { RuleConditionValues } from "../RuleConditionValues";
import { RuleInputWrapper } from "../RuleInputWrapper";

interface DiscountConditionRowProps {
  conditionIndex: number;
  onRemove: () => void;
  updateCondition: (index: number, value: Condition) => void;
  isConditionTypeSelected: (conditionType: string) => boolean;
}

export const RuleConditionRow = ({
  conditionIndex,
  onRemove,
  isConditionTypeSelected,
  updateCondition,
}: DiscountConditionRowProps) => {
  const { watch } = useFormContext<Rule>();
  const { disabled } = useDiscountRulesContext();
  const condition = watch(`conditions.${conditionIndex}`);
  const isProductCondition = condition?.id === "product";

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={3}
      padding={3}
      borderRadius={4}
      borderWidth={1}
      borderStyle="solid"
      borderColor="default1"
      backgroundColor="default1"
      data-test-id="rule-condition-row"
    >
      <Box
        display="grid"
        gap={2}
        __gridTemplateColumns="200px 106px 1fr 35px"
        placeItems="center"
        alignItems="start"
      >
        <RuleInputWrapper data-test-id="rule-condition-predicate-dropdown">
          <RuleConditionName
            conditionIndex={conditionIndex}
            updateCondition={updateCondition}
            isConditionTypeSelected={isConditionTypeSelected}
          />
        </RuleInputWrapper>

        <RuleInputWrapper data-test-id="rule-condition-type-dropdown">
          <RuleConditionType conditionIndex={conditionIndex} />
        </RuleInputWrapper>

        <RuleInputWrapper data-test-id="rule-condition-value-dropdown">
          <RuleConditionValues conditionIndex={conditionIndex} />
        </RuleInputWrapper>

        <Button
          data-test-id={`condition-remove-${conditionIndex}`}
          variant="tertiary"
          icon={<Minus size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
          onClick={onRemove}
          disabled={disabled}
        />
      </Box>

      {isProductCondition && (
        <RuleConditionSelectedProducts conditionIndex={conditionIndex} disabled={disabled} />
      )}
    </Box>
  );
};
