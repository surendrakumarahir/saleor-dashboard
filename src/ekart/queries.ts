import { gql } from "@apollo/client";

export const EKART_DEFAULTS_QUERY = gql`
  query EkartDefaults {
    ekartDefaults {
      configured
      sellerName
      sellerAddress
      defaultWeightGrams
      defaultLengthCm
      defaultWidthCm
      defaultHeightCm
      pickupAlias
    }
  }
`;

export const EKART_PICKUP_ADDRESSES_QUERY = gql`
  query EkartPickupAddresses {
    ekartPickupAddresses {
      alias
      phone
      addressLine1
      addressLine2
      pincode
      city
      state
      country
    }
  }
`;

export const EKART_CHECK_SERVICEABILITY_QUERY = gql`
  query EkartCheckServiceability($pincode: String!) {
    ekartCheckServiceability(pincode: $pincode) {
      status
      pincode
      remark
      cod
      maxCodAmount
      forwardPickup
      forwardDrop
      city
      state
      error
    }
  }
`;

export const EKART_ESTIMATE_RATES_QUERY = gql`
  query EkartEstimateRates(
    $orderId: ID!
    $weightGrams: Int!
    $lengthCm: Int!
    $widthCm: Int!
    $heightCm: Int!
    $paymentMode: EkartPaymentModeEnum!
    $codAmount: Float
    $pickupAlias: String
  ) {
    ekartEstimateRates(
      orderId: $orderId
      weightGrams: $weightGrams
      lengthCm: $lengthCm
      widthCm: $widthCm
      heightCm: $heightCm
      paymentMode: $paymentMode
      codAmount: $codAmount
      pickupAlias: $pickupAlias
    ) {
      pickupPincode
      dropPincode
      error
      quotes {
        service
        available
        courierGroup
        tatMin
        tatMax
        forwardFreight
        fuelSurcharge
        codCharges
        taxes
        totalEstimate
        rtoEstimate
        zone
        volumetricWeightGrams
        billingWeightGrams
        error
      }
    }
  }
`;

export const EKART_CREATE_SHIPMENT_MUTATION = gql`
  mutation EkartCreateShipment($orderId: ID!, $input: EkartCreateShipmentInput!) {
    ekartCreateShipment(orderId: $orderId, input: $input) {
      trackingId
      trackingUrl
      order {
        id
        status
      }
      fulfillment {
        id
        status
        trackingNumber
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const EKART_DOWNLOAD_LABEL_MUTATION = gql`
  mutation EkartDownloadLabel($trackingId: String!) {
    ekartDownloadLabel(trackingId: $trackingId) {
      label {
        trackingId
        filename
        pdfBase64
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const EKART_CANCEL_SHIPMENT_MUTATION = gql`
  mutation EkartCancelShipment($fulfillmentId: ID!, $cancelFulfillment: Boolean) {
    ekartCancelShipment(fulfillmentId: $fulfillmentId, cancelFulfillment: $cancelFulfillment) {
      trackingId
      order {
        id
        status
      }
      fulfillment {
        id
        status
        trackingNumber
      }
      errors {
        field
        message
        code
      }
    }
  }
`;
