import {
  getAbsoluteApiUrl,
  getApiUrl,
  getBlogPostPreviewUrl,
  getStorefrontUrl,
} from "@dashboard/config";

describe("global config", () => {
  const { location } = window;

  beforeEach((): void => {
    jest.clearAllMocks();

    delete (window as { location?: unknown }).location;

    const testingUrl = new URL("https://foo.saleor.cloud/dashboard/product/asdf?aaaa=bbbb");

    // Mock window.location for testing purposes
    Object.defineProperty(window, "location", {
      // URL matches fields from location so we can just put it there
      value: testingUrl,
      writable: true,
      configurable: true,
    });
  });
  afterAll((): void => {
    Object.defineProperty(window, "location", {
      value: location,
      writable: true,
      configurable: true,
    });
  });

  describe("getApiUrl", () => {
    it.each(["/graphql/", "https://foo.saleor.cloud/graphql/"])(
      "Returns value assigned to global window: %s",
      param => {
        window.__SALEOR_CONFIG__.API_URL = param;

        expect(getApiUrl()).toEqual(param);
      },
    );
  });

  describe("getAbsoluteApiUrl", () => {
    it.each<{ envParam: string; expected: string }>([
      {
        envParam: "/graphql/",
        expected: "https://foo.saleor.cloud/graphql/",
      },
      {
        envParam: "https://foo.saleor.cloud/graphql/",
        expected: "https://foo.saleor.cloud/graphql/",
      },
      {
        envParam: "https://other.saleor.cloud/graphql/",
        expected: "https://other.saleor.cloud/graphql/",
      },
    ])("Correctly builds absolute url: %s", ({ envParam, expected }) => {
      window.__SALEOR_CONFIG__.API_URL = envParam;

      expect(getAbsoluteApiUrl()).toEqual(expected);
    });
  });

  describe("getStorefrontUrl", () => {
    afterEach(() => {
      delete window.__SALEOR_CONFIG__.STOREFRONT_URL;
    });

    it("resolves localhost:3000 when running on localhost", () => {
      Object.defineProperty(window, "location", {
        value: new URL("http://localhost:9000/blogs/1"),
        writable: true,
        configurable: true,
      });

      expect(getStorefrontUrl()).toEqual("http://localhost:3000");
      expect(getBlogPostPreviewUrl("my-test-slug")).toEqual(
        "http://localhost:3000/blogs/my-test-slug",
      );
      expect(getBlogPostPreviewUrl()).toEqual("http://localhost:3000/blogs");
    });

    it("strips dashboard prefix for deployed dashboard domains like dashboard.easytopick.in", () => {
      Object.defineProperty(window, "location", {
        value: new URL("https://dashboard.easytopick.in/blogs/1"),
        writable: true,
        configurable: true,
      });

      expect(getStorefrontUrl()).toEqual("https://easytopick.in");
      expect(getBlogPostPreviewUrl("smart-farming-ai")).toEqual(
        "https://easytopick.in/blogs/smart-farming-ai",
      );
    });

    it("strips admin prefix for admin subdomains", () => {
      Object.defineProperty(window, "location", {
        value: new URL("https://admin.easytopick.in/blogs"),
        writable: true,
        configurable: true,
      });

      expect(getStorefrontUrl()).toEqual("https://easytopick.in");
    });

    it("uses window.__SALEOR_CONFIG__.STOREFRONT_URL when specified", () => {
      window.__SALEOR_CONFIG__.STOREFRONT_URL = "https://custom-store.easytopick.in/";

      expect(getStorefrontUrl()).toEqual("https://custom-store.easytopick.in");
      expect(getBlogPostPreviewUrl("example-slug")).toEqual(
        "https://custom-store.easytopick.in/blogs/example-slug",
      );
    });
  });
});
