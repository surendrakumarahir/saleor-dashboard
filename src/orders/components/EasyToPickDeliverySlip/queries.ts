import { gql } from "@apollo/client";

export const deliverySlipOrderQuery = gql`
  query DeliverySlipOrder($id: ID!) {
    order(id: $id) {
      id
      number
      created
      isPaid
      paymentStatus
      chargeStatus
      customerNote
      userEmail
      shippingAddress {
        id
        firstName
        lastName
        companyName
        streetAddress1
        streetAddress2
        city
        countryArea
        postalCode
        phone
        country {
          code
          country
        }
      }
      billingAddress {
        id
        firstName
        lastName
        companyName
        streetAddress1
        streetAddress2
        city
        countryArea
        postalCode
        phone
        country {
          code
          country
        }
      }
      total {
        gross {
          amount
          currency
        }
      }
      totalCharged {
        amount
      }
      shippingMethodName
      lines {
        id
        productName
        productSku
        quantity
        variant {
          id
          name
        }
      }
    }
  }
`;
