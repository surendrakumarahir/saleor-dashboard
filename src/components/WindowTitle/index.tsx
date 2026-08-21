import useShop from "@dashboard/hooks/useShop";
import { Helmet } from "react-helmet";

interface WindowTitleProps {
  title: string;
}

export const WindowTitle = ({ title }: WindowTitleProps) => {
  // const shop = useShop();
  const shopName = "EasyToPick Dashboard";

  return !title ? null : <Helmet title={`${title} | ${shopName}`} />;
};    
