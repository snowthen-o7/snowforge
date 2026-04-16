# Google Merchant Center — Product Data Specification Reference

> Compiled from official Google support articles. Use as reference for feed validation, audit tools, and pipeline logic.
> Last updated: 2026-03-25

---

## Table of Contents

- [ID](#id-id)
- [Title](#title-title)
- [Description](#description-description)
- [Link](#link-link)
- [Image Link](#image-link-image_link)
- [Additional Image Link](#additional-image-link-additional_image_link)
- [Availability](#availability-availability)
- [Availability Date](#availability-date-availability_date)
- [Price](#price-price)
- [Sale Price](#sale-price-sale_price)
- [Sale Price Effective Date](#sale-price-effective-date-sale_price_effective_date)
- [Cost of Goods Sold](#cost-of-goods-sold-cost_of_goods_sold)
- [Expiration Date](#expiration-date-expiration_date)
- [Brand](#brand-brand)
- [GTIN](#gtin-gtin)
- [MPN](#mpn-mpn)
- [Identifier Exists](#identifier-exists-identifier_exists)
- [Condition](#condition-condition)
- [Google Product Category](#google-product-category)
- [Product Type](#product-type-product_type)
- [Color](#color-color)
- [Gender](#gender-gender)
- [Age Group](#age-group-age_group)
- [Material](#material-material)
- [Pattern](#pattern-pattern)
- [Size](#size-size)
- [Size Type](#size-type-size_type)
- [Size System](#size-system-size_system)
- [Item Group ID](#item-group-id-item_group_id)
- [Multipack](#multipack-multipack)
- [Bundle](#bundle-is_bundle)
- [Adult](#adult-adult)
- [Unit Pricing Measure](#unit-pricing-measure-unit_pricing_measure)
- [Unit Pricing Base Measure](#unit-pricing-base-measure-unit_pricing_base_measure)
- [Installment](#installment-installment)
- [Subscription Cost](#subscription-cost-subscription_cost)
- [Loyalty Program](#loyalty-program-loyalty_program)
- [Minimum Price](#minimum-price-auto_pricing_min_price)
- [Certification](#certification-certification)
- [Energy Efficiency Class](#energy-efficiency-class-energy_efficiency_class)
- [Product Dimensions & Weight](#product-dimensions--weight)
- [Product Detail](#product-detail-product_detail)
- [Product Highlight](#product-highlight-product_highlight)
- [Ads Redirect](#ads-redirect-ads_redirect)
- [Custom Labels 0–4](#custom-labels-04-custom_label_0custom_label_4)
- [Promotion ID](#promotion-id-promotion_id)
- [Lifestyle Image Link](#lifestyle-image-link-lifestyle_image_link)
- [Short Title](#short-title-short_title)
- [External Seller ID](#external-seller-id-external_seller_id)
- [Excluded Destination](#excluded-destination-excluded_destination)
- [Included Destination](#included-destination-included_destination)
- [Excluded Countries for Shopping Ads](#excluded-countries-for-shopping-ads-shopping_ads_excluded_country)
- [Pause](#pause-pause)
- [Shipping](#shipping-shipping)
- [Carrier Shipping](#carrier-shipping-carrier_shipping)
- [Shipping Label](#shipping-label-shipping_label)
- [Shipping Weight](#shipping-weight-shipping_weight)
- [Shipping Dimensions](#shipping-dimensions-shipping_lengthshipping_widthshipping_height)
- [Ships From Country](#ships-from-country-ships_from_country)
- [Handling Time](#handling-time-max_handling_timemin_handling_time)
- [Shipping Transit Business Days](#shipping-transit-business-days-shipping_transit_business_days)
- [Shipping Handling Business Days](#shipping-handling-business-days-shipping_handling_business_days)
- [Free Shipping Threshold](#free-shipping-threshold-free_shipping_threshold)
- [Return Policy Label](#return-policy-label-return_policy_label)

---

## ID [id]

**Required** for each product.

### Format
| Field | Value |
|---|---|
| Type | Unicode characters (Recommended: ASCII only): alphanumeric, underscores, and dashes |
| Limits | 1–50 characters |
| Repeated | No |
| Schema.org | Product.sku, Type: Text |

### Minimum Requirements
- Submit a **unique ID** for each different product.
- Use a **stable ID** for each product. Once assigned, don't change it. The ID + target country + language identifies the product and tracks performance history.
- Use the **same ID** for the same product targeting different countries or languages.
- **Don't use casing to make IDs unique.** IDs are case-sensitive in Merchant Center, but two IDs differing only by casing (e.g., "abc123" vs "ABC123") may be confused in Google Ads filtering or supplemental feed matching.
- **Don't reuse or recycle** the same ID for different products. Don't reuse IDs for variants — each variant needs its unique ID.
- **Avoid white space.** Consecutive white spaces and white spaces before/after the ID will be automatically removed.
- **Don't submit invalid unicode characters.** Use UTF-8 encoding. Invalid characters include: control characters (e.g., U+200D), function characters, private area characters, surrogate pairs, unassigned code points.

### Best Practices
- Use **SKUs as IDs** where possible. SKUs are unique and help understand landing page structure.

---

## Title [title]

**Required** for each product. Also supports `structured_title` for AI-generated titles.

### Format
| Field | Value |
|---|---|
| Type | String (Unicode characters. Recommended: ASCII only) |
| Limits | 1–150 characters |
| Repeated | No |
| Schema.org | Product.name, Type: Text |

### Minimum Requirements
- Use a **relevant title that clearly describes** your product.
- **Describe the product shown on your landing page.** Title must refer to the same product.
- **Distinguish between variants.** Add distinguishing details (e.g., "Google T-Shirt, Red").
- **Be specific.** The more specific, the easier for customers to identify the correct product.
- Use **professional and grammatically correct language.**
- **Don't use words from foreign languages** unless well understood.
- **Don't use foreign characters for gimmicky purposes** (e.g., (ಠ_ಠ)).
- **Don't use capital letters for emphasis.** Still use caps for abbreviations (ADHD, UNICEF, UK, USD).
- **Don't include promotional text.** No price, sale price, sale dates, shipping, delivery date, company name.
- **Don't use extra white spaces.**
- All titles created using generative AI must use `structured_title` with `digital_source_type` = `trained_algorithmic_media`.
- If both `structured_title` and `title` are provided, only `title` is used.

### Best Practices
- **Use all 150 characters.** Title is used to match product to search.
- **Put the most important details first.** Users usually see only the first 70 or fewer characters.
- **Use keywords:** product name, brand, specific details (e.g., "maternity" for apparel, "waterproof" for mascara).
- Add the product's **brand name** if it's a differentiating factor.
- `short_title` can be used in addition to `title` for Demand Gen ads.

---

## Description [description]

**Required** for each product. Also supports `structured_description` for AI-generated descriptions.

### Format
| Field | Value |
|---|---|
| Type | String (Unicode characters. Recommended: ASCII only) |
| Limits | 1–5,000 characters |
| Repeated | No |
| Schema.org | Product.description, Type: Text |

### Minimum Requirements
- **Describe only the product itself.** Don't describe compatible products, accessories, business history, or policies.
- Use **professional and grammatically correct language.**
- **Don't use words from foreign languages** unless well understood.
- **Don't use foreign characters for gimmicky purposes.**
- Use **XML entities or escaped characters** instead of symbols in XML/JSON.
- **Don't include comparisons** or details about other products.
- **Don't include references to categorization systems** (use `google_product_category` or `product_type` instead).
- **Don't include links** to your store or other websites (use `link` attribute).
- **Don't use capital letters for emphasis.**
- **Don't include promotional text** (price, sale price, shipping, delivery date, company name).
- Products without description will receive a warning and may have limited performance.
- All descriptions created using generative AI must use `structured_description`.

### Best Practices
- **Be specific and accurate.**
- **List the most important details in the first 160–500 characters.** Customers must click to view beyond that.
- Include: size, material, intended age range, special features, technical specifications, shape, pattern, texture, design, variants.

---

## Link [link]

**Required** for each product.

### Format
| Field | Value |
|---|---|
| Type | URL (including http or https), ASCII characters only, RFC 3986 compliant |
| Limits | 1–2,000 characters |
| Repeated | No |
| Schema.org | Offer.url, Type: URL |

### Minimum Requirements
- **Landing page must be mobile friendly.**
- **Start with http or https** and comply with RFC 3986.
- Use your **verified domain name.**
- **URL must be crawlable by Google** (robots.txt configured correctly).
- **Replace any symbols or spaces** with URL encoded entities (e.g., & → %26).
- **Don't require users to register or sign in** to view product information.
- Submit **only one** link attribute per product.
- Use **legally required redirects** where needed.

### Best Practices
- Use a **stable URL** that doesn't change.
- **Pre-select the correct variant** on the landing page.
- **Don't include Google Ads ValueTrack parameters** in the link URL (use `ads_redirect` instead).
- Use **as few redirects as possible.**
- All redirects must stay on the **same verified domain.**

---

## Image Link [image_link]

**Required** for each product.

### Format
| Field | Value |
|---|---|
| Type | URL (including http or https), ASCII characters only, RFC 3986 compliant |
| Limits | 1–2,000 characters |
| Supported formats | JPEG (.jpg/.jpeg), WebP (.webp), PNG (.png), GIF (.gif), BMP (.bmp), TIFF (.tif/.tiff) |
| Repeated | No |
| Schema.org | Product.image, Type: URL |

### URL Requirements
- Must point to a **supported file format.**
- Start with **http or https** and comply with RFC 3986.
- Replace **symbols or spaces** with URL encoded entities (& → %26, comma → %2C).
- Must be **crawlable by Google** (robots.txt allows Googlebot and Googlebot-image).
- Submit **only one value** (use `additional_image_link` for more).

### Image Requirements
- **Minimum size:**
  - Non-apparel: at least **100 × 100 pixels**
  - Apparel: at least **250 × 250 pixels**
  - YouTube Shopping Ads on TV: at least **500 × 500 pixels**
- **No image larger than 64 megapixels.**
- **No image file larger than 16MB.**
- **Accurately display the entire product** with minimal staging.
- Show all products in a **bundle** if using `is_bundle`.
- **Don't use placeholders** or images that don't show the product.
- **Don't use generic images, graphics, or illustrations** (exceptions: Hardware ID 632, Vehicles & Parts ID 888, Software ID 313).
- **Don't use a logo or icon** instead of product image (exception: Software ID 313).
- **Don't use a single-color image** (exceptions: Vehicle Paint ID 3812, Craft Paint ID 505378, Painting Consumables ID 503740).
- **Don't use promotional elements:** calls to action, service info, free shipping, price, promotional adjectives, condition/compatibility, watermarks, brand names/logos (unless inherent to the product), barcodes.
- **Don't use borders.**
- AI-generated images must contain **IPTC DigitalSourceType metadata.**

### Best Practices
- Recommend images **near or above 1500×1500 pixels.**
- Product should take up **75%–90%** of the image space.
- Use **solid white or transparent background.**
- For apparel, show products **worn by people.**
- Show a **single unit** (even for multipacks).

---

## Additional Image Link [additional_image_link]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Type | URL (including http or https), ASCII characters only, RFC 3986 compliant |
| Limits | 0–2,000 characters per URL |
| Supported formats | JPEG, WebP, PNG, GIF, BMP, TIFF |
| Repeated | Up to **10** additional images |

### Minimum Requirements
- Meet the same requirements as `image_link`, plus:
  - Can include **product staging** or show product in use.
  - Can highlight **parts of the product.**
  - Can show **parts of a bundle.**
  - Can display the **entire multipack.**
- AI-generated images must contain IPTC metadata.

### Text Feed Formatting
- Separate each URL with a **comma (,)**
- Encode commas **within URLs** as %2C
- Don't encode the comma **separating** URLs

---

## Availability [availability]

**Required** for all products. Values must always match the website.

### Format
| Field | Value |
|---|---|
| Supported values | `in_stock`, `out_of_stock`, `preorder`, `backorder` (+ `build_to_order` for vehicle ads) |
| Repeated | No |

### Minimum Requirements
- **Match availability** on landing page, structured data, checkout page, and data source.
- For "in stock": Buy button must be **active.**
- For "out of stock": Buy button must be **inactive and greyed out.**
- Product must be **shippable**, not just in-store pickup (exception: Argentina, Chile).
- Provide `availability_date` if availability is **preorder** or **backorder.**
- **Don't delete products** when temporarily not accepting orders — use `pause` attribute or set to `out_of_stock`.

### Important Notes
- `preorder` = new products **not yet released.**
- `backorder` = existing products **temporarily out of stock** but accepting orders.
- Don't confuse the two.

---

## Availability Date [availability_date]

**Required** if availability = preorder or backorder. **Optional** otherwise.

### Format
| Field | Value |
|---|---|
| Type | Date, time, and timezone, ISO 8601 compliant (YYYY-MM-DDThh:mm[±hhmm] or YYYY-MM-DDThh:mmZ) |
| Limits | 1–25 characters |
| Repeated | No |

### Best Practices
- Submit for products with availability = preorder or backorder.
- Specify **time and timezone** (default: midnight UTC).
- Don't include date ranges. Submit estimated date, update when confirmed.

---

## Price [price]

**Required** for each product.

### Format
| Field | Value |
|---|---|
| Type | Number plus currency (ISO 4217) |
| Repeated | No |

### Minimum Requirements
- Submit amount and currency matching **landing page and checkout.**
- Show price in **target country's currency** prominently.
- **Don't change price based on user location** (no IP detection).
- If price varies by region, use the **regional pricing program.**
- **Don't provide more than 2 decimal digits.** Google silently rounds (1.0234 → 1.02, 29.8999 → 29.90).
- **Don't include shipping costs** in price (use shipping settings/attribute).
- **Don't include activation fees** for wireless plans (US).
- Comply with **local laws.**
- Discount/coupon prices allowed if available to **every user** and displayed on landing page.
- **Don't submit member prices** in price or sale_price — use `loyalty_program` attribute.

---

## Sale Price [sale_price]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Type | Number plus currency (ISO 4217) |
| Repeated | No |

### Minimum Requirements
- Meet same requirements as `price` with exceptions.
- Sale price **doesn't have to be the most prominent** price on the landing page.
- **Clearly display both** non-sale and sale prices on landing pages, and only the sale price at checkout.
- Submit value **matching the sale price** on landing page and at checkout.
- **Continue to submit the full price** via the `price` attribute.
- Sale price **must be less than price.**
- **Don't provide more than 2 decimal digits.**
- **Don't submit sale price for loyalty prices** — use `loyalty_program` attribute.

### Best Practices
- Submit `sale_price_effective_date` to indicate when the sale is relevant.
- Submit correct **base prices** to enable sale price annotations.

---

## Sale Price Effective Date [sale_price_effective_date]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Type | Date range, ISO 8601 standard. Start date / end date with time and timezone. |
| Format | YYYY-MM-DDThh:mm[±hhmm]/YYYY-MM-DDThh:mm[±hhmm] |
| Limits | 0–51 characters |
| Repeated | No |

### Best Practices
- Include **start and end times with time zones.** Default: midnight UTC.

---

## Cost of Goods Sold [cost_of_goods_sold]

**Required** for automated discounts and dynamic promotions. **Optional** otherwise.

### Format
| Field | Value |
|---|---|
| Type | Number plus currency (ISO 4217) |
| Repeated | No |

### Minimum Requirements
- Use currency with **ISO 4217 codes** (e.g., "USD").
- Use **"." rather than ","** to indicate decimal point.

### Best Practices
- Use the **same currency** as the `price` attribute.

---

## Expiration Date [expiration_date]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Type | Date, time, and time zone, ISO 8601 compliant (YYYY-MM-DDThh:mm[±hhmm] or YYYY-MM-DDThh:mmZ) |
| Limits | 25 characters |
| Repeated | No |

### Minimum Requirements
- Provide a date **up to one year in the future.**

### Notes
- All products expire from Merchant Center **30 days after the last refresh** (whichever is sooner).
- Products added directly in Merchant Center don't expire.

---

## Brand [brand]

**Required** for each product with a clearly associated brand or manufacturer. **Required** when the manufacturer is also the merchant. **Optional** for products without a clear brand (movies, books, music, posters).

### Format
| Field | Value |
|---|---|
| Type | String (Unicode characters. Recommended: ASCII only) |
| Limits | 1–70 characters |
| Repeated | No |
| Schema.org | Product.brand, Type: Brand |

### Minimum Requirements
- Use the brand name people shopping online will **generally recognize.**
- Use the **store name** as brand for custom/homemade goods (also include MPN with unique identifier instead of identifier_exists=false).
- Only provide a brand if you're **sure it's correct.** Don't guess.

### Best Practices
- Submit **publisher name** as brand for media products (CDs).
- Submit brand in **only 1 language or alphabet.**

---

## GTIN [gtin]

**Strongly recommended** for all products with a GTIN assigned by the manufacturer.

### Format
| Field | Value |
|---|---|
| Type | Number (spaces and dashes accepted but ignored) |
| Limits | 0, 8, 12, 13, or 14 digits |
| Repeated | Up to 10 |

### GTIN Types
- **UPC** (North America / GTIN-12): 12 digits (convert 8-digit UPC-E to 12 digits)
- **EAN** (Europe / GTIN-13): 13 digits
- **JAN** (Japan / GTIN-13): 8 or 13 digits
- **ISBN** (books): 13 digits (convert ISBN-10 to ISBN-13; submit only 13-digit)
- **ITF-14** (multipacks / GTIN-14): 14 digits

### Minimum Requirements
- Submit as defined in the **official GS1 validation guide:**
  - **Check digit must be present and correct** (GS1 Check digit calculator).
  - **Don't submit restricted ranges.** Restricted prefixes: **02, 04, or 2x.**
  - **Don't submit coupon ranges.** Coupon prefixes: **05, 98, or 99.**
- **Don't submit a GTIN for a product that doesn't have one.**
- Use the **correct GTIN for each product**, including variants.
- **Don't guess or make up a value.**
- Products with missing or incorrect GTIN may have **limited visibility.**

---

## MPN [mpn]

**Required** for all products without a manufacturer-assigned GTIN. **Optional** for custom/handmade products.

### Format
| Field | Value |
|---|---|
| Type | String (Alphanumeric, Unicode. Recommended: ASCII only) |
| Limits | 1–70 characters |
| Repeated | No |
| Schema.org | Product.mpn, Type: Text |

### Minimum Requirements
- Use the MPN **assigned by the manufacturer.** Don't create your own unless you are the manufacturer.
- Use the **correct MPN for each variant** (exception: apparel sizes often share the same MPN).

---

## Identifier Exists [identifier_exists]

Use to indicate that unique product identifiers (GTIN, MPN, brand) **aren't available** for your product.

### Format
| Field | Value |
|---|---|
| Type | Boolean |
| Supported values | yes, true, no, false (must be submitted in English) |
| Repeated | No |

### Minimum Requirements
- Only set to **no/false** if you're certain the product has no assigned unique product identifiers.
- Products incorrectly set to no/false **where identifiers exist** will receive a warning.

---

## Condition [condition]

**Required** for used and refurbished products. **Optional** for new products.

### Format
| Field | Value |
|---|---|
| Supported values | `new`, `refurbished`, `used` (must be submitted in English) |
| Repeated | No |

### Values
- **new**: Never used, in original packaging, not opened.
- **refurbished**: Professionally restored to working order, appears new, comes with warranty. Not supported for Vehicle ads.
- **used**: Second-hand, modified from original condition, original packaging opened or missing.

---

## Google Product Category

(Not included in provided specs, but referenced throughout.)

Uses Google's predefined taxonomy of 6,000+ categories. Format: numeric ID (e.g., "166") or text path (e.g., "Apparel & Accessories > Clothing").

---

## Product Type [product_type]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Type | String (Unicode characters. Recommended: ASCII only) |
| Limits | 0–750 characters |
| Repeated | Submit up to 5 (only first used for Google Ads bidding/reporting) |

### Important
- **Commas separate different product types.** Don't use commas within a single product type value. "House, Garden & Kitchen" is interpreted as "House" separate from "Garden & Kitchen".
- Use **>** to separate levels in a category, with a space before and after.

### Best Practices
- Submit the **full breadcrumb** (e.g., "Home > Women > Dresses > Maxi Dresses").
- Submit for products in **any campaign type.**
- Submit **only 1 value** if using for bidding/reporting.

---

## Color [color]

**Required** for Apparel & Accessories (ID 166) products (free listings and Shopping ads in BR/FR/DE/JP/UK/US).

### Format
| Field | Value |
|---|---|
| Type | String (Alphanumeric, Unicode. Recommended: ASCII) |
| Limits | 1–100 characters total (1–40 characters per color) |
| Repeated | No |

### Minimum Requirements
- Submit the **color of your product.**
- Submit **only one attribute per variant.**
- Use the **same color** as on your landing page.
- Up to **3 colors** separated by **slash (/)**: primary color / secondary / tertiary. Example: "Red/Green/Black"
- **Don't use commas** to separate colors. Only one color will be applied.
- **Don't use numbers** as a color (e.g., "0 2 4 6 8").
- **Don't use hex codes** (e.g., "#fff000").
- Include **more than 1 letter** (exception: CJK single characters like 红).
- **Don't reference the image** (e.g., "see image").
- **Don't submit non-color values** (e.g., "variety", "mens", "womens", "N/A").

---

## Gender [gender]

**Required** for Apparel & Accessories (ID 166) products (free listings and Shopping ads in BR/FR/DE/JP/UK/US).

### Format
| Field | Value |
|---|---|
| Supported values | `male`, `female`, `unisex` (must be submitted in English) |
| Repeated | No |

---

## Age Group [age_group]

**Required** for Apparel & Accessories (ID 166) products (free listings and Shopping ads in BR/FR/DE/JP/UK/US).

### Format
| Field | Value |
|---|---|
| Supported values | `newborn` (0–3 months), `infant` (3–12 months), `toddler` (1–5 years), `kids` (5–13 years), `adult` (13+ years) |
| Repeated | No |

### Best Practices
- Submit an accurate value for all products that **vary by age group.**
- For products **not exclusively for children,** submit `adult` (does not mean adult content).
- Pair with `gender` attribute where appropriate.

---

## Material [material]

**Required** for all products that vary by material. **Optional** where material is an important feature.

### Format
| Field | Value |
|---|---|
| Type | Unicode characters (Recommended: ASCII only), not case sensitive |
| Limits | 0–200 characters |
| Repeated | No |

### Minimum Requirements
- Include the **main fabric or material.** Don't include color, size, or pattern values.
- Submit **only one value.** For multiple materials, use **slash (/)** separator: "cotton/polyester/elastane" (up to 3).

### Best Practices
- Use values **customers will understand** (not "calf" but "calfskin", not "lthr" but "leather").
- Don't submit "n/a", "none", "multi", or "other".

---

## Pattern [pattern]

**Required** for all products that vary by pattern. **Optional** where pattern is an important feature.

### Format
| Field | Value |
|---|---|
| Type | Unicode characters (Recommended: ASCII only) |
| Limits | 0–100 characters |
| Repeated | No |

### Minimum Requirements
- Include the **pattern or graphic** on your product. Don't include color, size, or material values.
- Submit **only one value.**

### Best Practices
- Use values users understand (not "plka" but "polka dots").
- Don't submit "n/a", "none", "multi", or "other".

---

## Size [size]

**Required** for Clothing (ID 1604) and Shoes (ID 187) products (free listings and Shopping ads in BR/FR/DE/JP/UK/US).

### Format
| Field | Value |
|---|---|
| Type | String (Unicode characters. Recommended: ASCII only) |
| Limits | 1–100 characters |
| Repeated | No |

### Minimum Requirements
- Use a **standard size value** for your target country.
- Submit **only one attribute per product.**
- Submit **only the size value.** Don't submit "n/a", "none", or "multisize".
- Don't submit non-size information (use color, material, pattern instead).
- **Don't use commas** to separate multiple sizes. Use **slash (/)** instead. Example: "16/34" for neck/sleeve.
- For non-apparel, submit the relevant size.

### Best Practices
- Use **consistent format** (e.g., "S", "M", "L" — not "S", "Medium", "Lrg").
- Submit the **complete size** (e.g., "8 N" for narrow, not just "8").
- Don't submit multipack quantity as part of size.

---

## Size Type [size_type]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Supported values | `regular`, `petite`, `plus`, `tall`, `big`, `maternity` |
| Repeated | Yes (maximum 2 values) |

### Best Practices
- If not submitted, default is `regular`.
- Can submit **two values** (e.g., "big, tall" or "petite, maternity").

---

## Size System [size_system]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Supported values | `AU`, `BR`, `CN`, `DE`, `EU`, `FR`, `IT`, `JP`, `MEX`, `UK`, `US` |
| Repeated | No |

### Best Practices
- Submit for **all apparel products.**
- If not submitted, Google uses the **standard system for your target country** (which might not be right).

---

## Item Group ID [item_group_id]

**Required** for product variants (free listings and Shopping ads in BR/FR/DE/JP/UK/US).

### Format
| Field | Value |
|---|---|
| Type | Unicode characters (Recommended: ASCII only): alphanumeric, underscores, and dashes |
| Limits | 1–50 characters |
| Repeated | No |

### Minimum Requirements
- Submit a **unique item group ID** for each product group. All variants of the same product share the same value.
- Each **distinct item group must have a unique value.**
- **Don't rely on casing** — "abc123" and "ABC123" are treated as the same.
- **Don't reuse or recycle** the same item group ID.
- Submit a **variant attribute** along with item group ID (color, pattern, material, age_group, gender, size).
- Use the **same variant attributes** for all products with the same item group ID.
- Make sure landing page **matches the values** for title, color, pattern, material, price, availability, image_link.

### Best Practices
- Use the **parent SKU** as item group ID. Don't submit a parent SKU as a separate product.
- Don't mix up **item_group_id and id.**
- Use a **stable value** — don't change it.
- Don't use for **unsupported variants** (e.g., car make/model) or products with **more than 30 variants.**

---

## Multipack [multipack]

**Required** for retailer-defined multipacks (free listings; Shopping ads in AU/BR/CZ/FR/DE/IT/JP/NL/ES/CH/UK/US).

### Format
| Field | Value |
|---|---|
| Type | Number (integer) |
| Repeated | No |

### Minimum Requirements
- Submit the **number of manufacturer-defined individual products** you've grouped together.
- **Don't use for manufacturer-defined multipacks.** Use `unit_pricing_measure` instead.

---

## Bundle [is_bundle]

**Required** for retailer-defined bundles containing a main product (free listings; Shopping ads in AU/BR/CZ/FR/DE/IT/JP/NL/ES/CH/UK/US).

### Format
| Field | Value |
|---|---|
| Type | Boolean |
| Supported values | yes, true, no, false |
| Repeated | No |

### Minimum Requirements
- Submit `yes` if your product is a **custom bundle** with a main product. Default: `no`.
- **Don't use for manufacturer-defined bundles.**

### Best Practices
- Describe the **entire bundle** in title, description, image.
- If any product in the bundle is used, set condition to `used`.

---

## Adult [adult]

**Required** if product contains adult content (nudity, sexually suggestive, intended to enhance sexual activity).

### Format
| Field | Value |
|---|---|
| Type | Boolean |
| Supported values | yes, true, no, false |
| Repeated | No |

### Important
- **Don't use** to indicate age group. Use `age_group` for that.
- **Don't use** for alcohol. Use `google_product_category` instead.

---

## Unit Pricing Measure [unit_pricing_measure]

**Optional** for each product. **Required** in EU/EFTA/UK/AU/NZ for products sold by weight, volume, length, or area.

### Format
| Field | Value |
|---|---|
| Type | Positive number plus unit |
| Repeated | No |

### Supported Units
- **Weight:** oz, lb, mg, g, kg
- **Volume (US imperial):** floz, pt, qt, gal
- **Volume (metric):** ml, cl, l, cbm
- **Length:** in, ft, yd, cm, m
- **Area:** sqft, sqm
- **Per unit:** ct, sheet, item

### Minimum Requirements
- Submit total amount (number) and units.
- Submit either `unit_pricing_measure` **or** `energy_efficiency_class`, not both.
- Max **2 decimal digits.** Excess digits silently rounded.

---

## Unit Pricing Base Measure [unit_pricing_base_measure]

**Optional** for each product. Used with `unit_pricing_measure` to define the denominator for unit pricing.

### Format
| Field | Value |
|---|---|
| Supported values | Whole number plus unit (same units as unit_pricing_measure) |
| Supported integers | 1, 10, 100, 2, 4, 8 |
| Additional metric combos | 75cl, 750ml, 50kg, 1000kg |
| Repeated | No |

### Best Practices
- Use the **same unit type** as `unit_pricing_measure`.

---

## Installment [installment]

**Optional.** Available in Latin America (all categories) and certain other countries (wireless products only). Not eligible for cross-border trade.

### Sub-attributes
- **months** (Required): Number of installments
- **amount** (Required): ISO 4217, monthly payment
- **downpayment** (Optional): One-time upfront payment
- **credit_type** (Optional): `finance` or `lease` (vehicle ads only)
- **apr** (Optional): Annual percentage rate (US vehicle ads finance offers)

### Minimum Requirements
- Match the installment plan on your **landing page.**
- Don't require a **loyalty card.**
- Don't use for **software subscriptions** (prepay using price attribute).
- Use only in **approved countries and product categories.**

---

## Subscription Cost [subscription_cost]

**Optional** for telecommunications. **Required** for physical goods subscriptions.

### Sub-attributes
- **period** (Required): `week`, `month`, or `year`
- **period_length** (Required): Integer > 0
- **amount** (Required): ISO 4217, payment per period

### Availability
- **Telecom:** Available in select countries for mobile products (Watches ID 201, Mobile Phones ID 267, Tablets ID 4745, etc.)
- **Physical goods:** US only, for specific categories (Personal Care, Health Care, Pet Supplies, etc.)

### Physical Goods Notes
- **price must be 0** (ignored and not shown).
- Sale price also ignored.
- Landing page must clearly display subscription price with currency and duration.

---

## Loyalty Program [loyalty_program]

**Optional.** For member pricing, loyalty points, and member shipping.

### Sub-attributes
- **program_label** (Required for multi-tier)
- **tier_label** (Required for multi-tier)
- **price** (Optional): Member-specific pricing
- **cashback_for_future_use** (Optional): Reserved
- **loyalty_points** (Optional): Whole number
- **member_price_effective_date** (Optional): ISO 8601 date range
- **shipping_label** (Optional)

### Minimum Requirements
- Currency of price sub-attribute must match `price` and `sale_price` attributes.
- Member price must be the **lowest possible price.**
- Must be submitted in `loyalty_program` price sub-attribute, **not** in `price` or `sale_price`.
- Data must **match your website.**
- `member_price_effective_date` required when member price is **time-limited.**

---

## Minimum Price [auto_pricing_min_price]

**Required** for automated discounts and dynamic promotions.

### Format
| Field | Value |
|---|---|
| Type | Number plus currency (ISO 4217) |
| Repeated | No |

### Minimum Requirements
- Currency must **match the price attribute.**
- Must be **> 0** and between COGS and **95% of regular price.**
- Max **2 decimal digits.**

---

## Certification [certification]

**Optional.** For products requiring certification information (e.g., EU Energy Labeling, CO2 efficiency).

### Supported Certifications
- EU Energy Labeling (EPREL)
- CO2 Efficiency of Vehicles in France (ADEME)
- CO2 and Efficiency of Vehicles in Germany (BMWK)
- Energy Star in US and Canada

### Sub-attributes
- **certification_authority** (Required)
- **certification_name** (Required)
- **certification_code** (Sometimes required)
- **certification_value** (Sometimes required)

---

## Energy Efficiency Class [energy_efficiency_class]

**Optional.** Available only for products targeting Switzerland, Norway, or the United Kingdom (as of April 2025). EU products should use `certification` attribute.

### Format
| Field | Value |
|---|---|
| Supported values | A+++, A++, A+, A, B, C, D, E, F, G |
| Repeated | No |

### Related Attributes
- **min_energy_efficiency_class**: Least efficient class on the scale
- **max_energy_efficiency_class**: Most efficient class on the scale

### Requirements
- Energy efficiency class value must be **within the range** of min and max.
- Submit **either** unit_pricing_measure **or** energy_efficiency_class, not both.

### Applicable Products
Refrigerators, freezers, washing machines, tumble dryers, washer-dryers, wine storage, dishwashers, ovens, water heaters, air conditioners, lamps, luminaires, televisions.

---

## Product Dimensions & Weight

**Optional** for each product.

### Attributes
- `product_length`: cm or in (1–3000)
- `product_width`: cm or in (1–3000)
- `product_height`: cm or in (1–3000)
- `product_weight`: lb, oz, g, kg (0–2000)

### Best Practices
- Use the **same unit** for all dimension attributes.
- Use **actual assembled product weight.**
- Values must match any data in `product_detail` attribute.

---

## Product Detail [product_detail]

**Optional** for each product. Up to 1000 entries.

### Sub-attributes
- **section_name** (Optional but recommended): up to 140 characters
- **attribute_name** (Required): up to 140 characters
- **attribute_value** (Required): up to 1,000 characters

### Format
- In text feeds: `section_name:attribute_name:attribute_value`
- If no section name: `:attribute_name:attribute_value`

### Minimum Requirements
- Each entry must contain **2 colons** to separate sub-attributes.
- Don't add info covered by other attributes or promotional text.
- Only provide attribute name/value when the value is **confirmed.**

---

## Product Highlight [product_highlight]

**Optional** for all products.

### Format
| Field | Value |
|---|---|
| Type | String (Unicode characters. Recommended: ASCII only) |
| Limits | 1–150 characters per highlight |
| Repeated | Yes. Recommended 4–6. Min 2, Max 100. |

### Minimum Requirements
- At least **2** and at most **100** highlights.
- Separate multiple values with **commas.**
- **Describe only the product itself.** No business history, policies, compatible products.
- Use **professional language.** No ALL CAPS, gimmicky symbols, promotional text.
- **Don't include** links, comparisons, categorization references, keywords/SEO terms.
- No foreign characters for gimmicky purposes.

---

## Quick Reference: Character Limits

| Attribute | Min | Max |
|---|---|---|
| id | 1 | 50 |
| title | 1 | 150 |
| description | 1 | 5,000 |
| link | 1 | 2,000 |
| image_link | 1 | 2,000 |
| additional_image_link | 0 | 2,000 (per URL, max 10 URLs) |
| brand | 1 | 70 |
| mpn | 1 | 70 |
| color | 1 | 100 (40 per color) |
| material | 0 | 200 |
| pattern | 0 | 100 |
| size | 1 | 100 |
| product_type | 0 | 750 |
| item_group_id | 1 | 50 |
| sale_price_effective_date | 0 | 51 |
| expiration_date | — | 25 |
| availability_date | 1 | 25 |
| product_highlight | 1 | 150 (per highlight) |
| ads_redirect | 1 | 2,000 |
| custom_label_0–4 | 1 | 100 (1,000 unique values per label) |
| promotion_id | 1 | 50 |
| lifestyle_image_link | 1 | 2,000 |
| short_title | 1 | 150 (recommended: 5–65) |
| external_seller_id | 1 | 50 |
| shopping_ads_excluded_country | 2 | 2 (ISO 3166-1 Alpha-2) |
| shipping_weight | — | 2,000 lbs / 1,000 kg |
| shipping_length/width/height | 1 | 400 cm / 150 inch |
| ships_from_country | 2 | 2 (ISO 3166-1 Alpha-2) |
| return_policy_label | — | 100 |

## Quick Reference: Valid Enumerated Values

| Attribute | Valid Values |
|---|---|
| availability | in_stock, out_of_stock, preorder, backorder |
| condition | new, refurbished, used |
| gender | male, female, unisex |
| age_group | newborn, infant, toddler, kids, adult |
| size_type | regular, petite, plus, tall, big, maternity |
| size_system | AU, BR, CN, DE, EU, FR, IT, JP, MEX, UK, US |
| identifier_exists | yes, true, no, false |
| adult | yes, true, no, false |
| is_bundle | yes, true, no, false |
| energy_efficiency_class | A+++, A++, A+, A, B, C, D, E, F, G |

## Quick Reference: GTIN Validation Rules

| Rule | Details |
|---|---|
| Valid lengths | 8, 12, 13, or 14 digits |
| Check digit | Required, validated via GS1 algorithm |
| Restricted prefixes | 02, 04, 2x (variable measure / internal use) |
| Coupon prefixes | 05, 98, 99 |
| ISBN | Submit only 13-digit (convert ISBN-10 to ISBN-13) |
| Placeholder values | Don't submit all zeros, "1234...", "N/A", "none" |

## Quick Reference: Apparel Requirements (GPC 166)

These attributes are **required** for Apparel & Accessories products in free listings and Shopping ads (BR/FR/DE/JP/UK/US):

- `color`
- `gender`
- `age_group`
- `size` (for Clothing ID 1604 and Shoes ID 187)
- `item_group_id` (for variants)

---

## Ads Redirect [ads_redirect]

**Optional** for each product. Not available for free listings.

### Format
| Field | Value |
|---|---|
| Type | URL (including http or https), ASCII characters only, RFC 3986 compliant |
| Limits | 1–2,000 characters |
| Repeated | No |

### Minimum Requirements
- Redirect to a landing page meeting **landing page requirements.**
- Redirect to the **same landing page content** as the `link` or `mobile_link` attribute.
- If using parameters, use **accepted ValueTrack parameters.**
- Value must resolve into a **valid URL** after parameter expansion.

### Important
- With **parallel tracking**, the domains of `link`, `mobile_link` (if present), and `ads_redirect` **must match.** Mismatched domains = lost tracking.
- For accurate long-term click tracking, use **ValueTrack/custom parameters with a Google Ads tracking template** rather than hardcoding parameters in the URL.

### Best Practices
- **Avoid redirects.** Use Google Ads tracking template instead.
- After parameter expansion, domain must **exactly match** the `link` domain.
- For Vehicle Ads, include `{store_code}` ValueTrack parameter.
- Use `{ifmobile}` ValueTrack parameter for mobile-specific redirects.

---

## Custom Labels 0–4 [custom_label_0–custom_label_4]

**Optional** for each product. For Performance Max or Shopping campaigns only.

### Format
| Field | Value |
|---|---|
| Type | String (Unicode characters. Recommended: ASCII only), not case sensitive |
| Limits | 1–100 characters. Up to 1,000 unique values account-wide per custom label attribute (5,000 total). |
| Repeated | No (but 5 separate custom label attributes: 0 through 4) |

### Minimum Requirements
- Submit **only 1 value** for each custom label attribute.
- Max **1,000 unique labels** per custom label attribute across the account. Exceeding the limit = additional labels ignored for reporting and bidding.
- Use custom labels for **Performance Max or Shopping campaigns only.** For Display remarketing, use `ads_labels` and `ads_grouping`.

### Best Practices
- Create up to **5 custom labels** per product (custom_label_0 through custom_label_4).
- Choose your own **definition** for each label (e.g., seasonal, clearance, margin tier, selling rate).
- Use **feed rules** to assign custom labels automatically based on existing product data.

---

## Promotion ID [promotion_id]

**Optional** for each product. Not available for free listings.

### Format
| Field | Value |
|---|---|
| Type | Unicode characters (Recommended: ASCII only): alphanumeric, underscores, and dashes |
| Limits | 1–50 characters |
| Repeated | Up to 10 times |

### Minimum Requirements
- Submit if the promotion applies to **specific products** (product_applicability = specific_products).
- Use a **unique ID** for each different promotion.
- Use a **stable ID** — don't change it once assigned.
- **Don't reuse or recycle** IDs for different promotions.
- **Avoid white space.** Consecutive/leading/trailing spaces auto-removed.
- **Casing IS significant** — "abc123" and "ABC123" are different promotions.
- **Don't submit symbols** (%, !).
- **Don't submit invalid unicode** (control characters, function characters, etc.).

### Best Practices
- Match a product to **up to 10 promotions** by submitting promotion_id up to 10 times.

---

## Lifestyle Image Link [lifestyle_image_link]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Type | URL (including http or https), ASCII characters only, RFC 3986 compliant |
| Limits | 1–2,000 characters |
| Supported formats | GIF, JPEG, PNG, BMP, TIFF |
| Repeated | No |

### Image Requirements
- Minimum resolution: **600 × 600 pixels.**
- Aspect ratio between **2:0 and 2:3.**
- **No promotional elements** or text overlays (calls to action, prices, watermarks, brand names/logos, barcodes, retailer name/logo).
- **No borders or padding** to meet aspect ratio.
- AI-generated images must contain **IPTC DigitalSourceType metadata.**

### Best Practices
- Show product in **real-world context** (clothing on model, furniture in room, etc.).
- Use the **highest quality images** (up to 64 megapixels, 16MB).
- Don't just show product on a white background.

---

## Short Title [short_title]

**Optional** for each product. Used for Demand Gen ads.

### Format
| Field | Value |
|---|---|
| Type | String (Unicode characters. Recommended: ASCII only) |
| Limits | 1–150 characters (Recommended: 5–65 characters) |
| Repeated | No |

### Minimum Requirements
- **Be concise.** Unlike `title` (used for search matching), `short_title` is for display in Demand Gen ads.
- Describe the product on your **landing page.**
- Use **professional language.** No ALL CAPS, gimmicky symbols, HTML tags, promotional text.
- **Don't include** promotional text, pricing, shipping, delivery info, or company name.
- **Don't use extra white spaces.**

### Best Practices
- Limit to **65 or fewer characters** (first 65 visible depending on screen).
- Put **most important details first.**
- Add **brand name** if it's a differentiating factor.
- Can only use **your own brand name** if you manufacture the product.

---

## External Seller ID [external_seller_id]

**Required** for multi-seller accounts (marketplaces).

### Format
| Field | Value |
|---|---|
| Type | String (ASCII characters) |
| Limits | 1–50 characters, case-sensitive. Allowed: [0-9a-zA-Z.~_-] |
| Repeated | No |

### Minimum Requirements
- **Don't submit** unallowed characters (white space, control characters, commas, parentheses).
- Use **UTF-8 encoding.**
- Only use if you are a **marketplace** representing various sellers.
- Use the **same ID** for the same seller across countries/languages.

---

## Excluded Destination [excluded_destination]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Supported values | `Shopping_ads`, `Display_ads`, `Local_inventory_ads`, `Free_listings`, `Free_local_listings`, `Cloud_retail`, `Local_cloud_retail`, `youtube_affiliate`, `youtube_merchandise` |
| Repeated | Yes |

### Important
- If `excluded_destination` and `included_destination` **conflict**, excluded destination takes precedence.
- Use this to **prevent showing in certain destinations** while keeping others active.
- Better than setting availability to out_of_stock when you just want to stop showing a product.
- Use `pause` attribute to temporarily pause for up to 14 days.

---

## Included Destination [included_destination]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Supported values | `Shopping_ads`, `Display_ads`, `Local_inventory_ads`, `Free_listings`, `Free_local_listings`, `Cloud_retail`, `Local_cloud_retail` |
| Repeated | Yes |

### Important
- If `excluded_destination` and `included_destination` **conflict**, excluded takes precedence.

---

## Excluded Countries for Shopping Ads [shopping_ads_excluded_country]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Type | String |
| Limits | 2 characters. Must be ISO 3166-1 Alpha-2 country code. |
| Repeated | Up to 100 times |

### Minimum Requirements
- Only use supported **ISO 3166-1 Alpha-2 country codes.**

## Quick Reference: Destination Values

| Value | Description |
|---|---|
| Shopping_ads | Google Shopping ads |
| Display_ads | Dynamic remarketing ads |
| Local_inventory_ads | Local inventory ads |
| Free_listings | Free listings on Google |
| Free_local_listings | Free local product listings |
| Cloud_retail | Cloud Retail API project |
| Local_cloud_retail | Local Cloud Retail project |
| youtube_affiliate | YouTube Shopping affiliate channels |
| youtube_merchandise | YouTube store/shopping features |

---

## Pause [pause]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Supported values | `ads`, `all` |
| Repeated | No |

### Values
- **ads**: Pause for all ads (Shopping Ads, Display Ads, local inventory ads). Free listings continue.
- **all**: Pause for all locations (ads + free listings). Auto-archived after 14 days.

### Minimum Requirements
- Only pause for **14 days or less.** Use `excluded_destination` for longer pauses.
- Can't pause **only free listings** — use `excluded_destination` for that.
- **Don't use availability=out_of_stock** to pause ads/listings.

### Important
- Products paused > 14 days can take **one or more days to reactivate.**
- Better than deleting: adding a product back after deletion takes significant time.

---

## Shipping [shipping]

**Required** for Shopping ads and free listings in: AU, AT, BE, BR, CA, CZ, DK, FI, FR, DE, GR, HU, IN, IE, IL, IT, JP, NZ, NL, NO, PL, PT, RO, SK, KR, ES, SE, CH, UK, US.

### Sub-attributes
- **country** (Required): ISO 3166-1 country code
- **Delivery area** (Optional, one of): region, postal_code, location_id, location_group_name
- **service** (Conditionally optional): Required if multiple shipping options for same location
- **price** (Required for speed overrides): Fixed cost + currency (e.g., "6.49 USD"). Use period as decimal.
- **Handling time** (Optional):
  - min_handling_time / max_handling_time (business days)
  - handling_cutoff_time (HHMM format, e.g., "1530")
  - handling_cutoff_timezone (IANA format, e.g., "America/Los_Angeles")
- **Transit time** (Optional):
  - min_transit_time / max_transit_time (business days)

### Format
| Field | Value |
|---|---|
| Type | Unicode characters (Recommended: ASCII only) |
| Repeated | Up to **100** times per product |

### Price Limits by Currency
| Currency | Max |
|---|---|
| AUD, CAD, CHF, EUR, GBP, NZD, SGD, USD | 1,000 |
| BRL, DKK, HKD, ILS, NOK, PLN, SEK, TRY | 5,000 |
| CZK, MXN, THB, TWD, ZAR | 20,000 |
| INR, JPY, PHP, RUB | 100,000 |
| KRW | 1,000,000 |

### Minimum Requirements
- Submit **complete and correct** shipping info including speed and costs.
- Include **all charges** with "shipping", "delivery", "handling", "logistics", or "carrier" in the name.
- **Overestimate** if you can't provide exact cost (but not excessively).
- Use rate for **shipping directly to individual** (not store pickup, not membership rates).
- Always provide the **country sub-attribute.**
- **Don't include government-imposed fees** (import duties, recycling fees, etc.) in shipping cost.

### Important
- If you submit the price sub-attribute, **account shipping settings are ignored** for that product in that location.
- For Google to calculate shipping speed, you must provide **max_handling_time AND max_transit_time AND price.**

---

## Carrier Shipping [carrier_shipping]

**Optional.** Calculates shipping cost/speed based on carrier service, origin location, and customer location.

### Sub-attributes
- **country** (Required): ISO 3166-1 code
- **Delivery area** (Optional): region, postal_code
- **origin_postal_code** (Required): Origin ZIP/postal code
- **Price** (one of):
  - flat_price: Fixed cost (e.g., "10.00 USD")
  - carrier_price: Carrier service enum (e.g., "USPS_MEDIA_MAIL")
- **Price adjustment** (Optional):
  - carrier_price_flat_adjustment: Fixed adjustment
  - carrier_price_percentage_adjustment: Percentage (e.g., -25 for 25% off)
- **Handling time** (Optional): min_handling_time, max_handling_time
- **Transit time** (one of):
  - fixed_min_transit_time / fixed_max_transit_time: Manual days
  - carrier_transit_time: Carrier service enum

### Format
| Field | Value |
|---|---|
| Repeated | Up to 10 per product (100 total shipping + carrier_shipping) |

### Important
- Requires **shipping_weight** to calculate carrier rates.
- Shipping dimensions improve accuracy.
- If both carrier_shipping handling sub-attributes and standalone handling attributes exist, **carrier_shipping sub-attributes win.**

---

## Shipping Label [shipping_label]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Type | Unicode characters (Recommended: ASCII only) |
| Repeated | No |

### Purpose
- Group products for **specific shipping rates** in Merchant Center (e.g., "oversized", "perishable", "free_shipping").
- Labels are **inclusive** — if multiple labels apply, the **lowest rate** is shown.

### Best Practices
- Use for **oversized products** that exceed carrier limits.
- Use for **perishable products** requiring cold storage transport.

---

## Shipping Weight [shipping_weight]

**Optional** for each product. Used for carrier-calculated rates.

### Format
| Field | Value |
|---|---|
| Type | Number plus unit |
| Supported units | lb, oz, g, kg |
| Limits | 0–2,000 lbs (imperial), 0–1,000 kg (metric). Decimals supported. |
| Repeated | No |

### Best Practices
- Use the **actual shipping weight.**
- Submit alongside **shipping dimensions** for accurate carrier-calculated rates.

---

## Shipping Dimensions [shipping_length/shipping_width/shipping_height]

**Optional** for each product. Used with carrier-calculated shipping.

### Format
| Field | Value |
|---|---|
| Type | Number plus dimension unit |
| Supported units | cm, inch |
| Limits | 1–400 cm, 1–150 inch |
| Repeated | No |

### Requirements
- If you include **any** dimension attribute, include **all three.**
- Use the **same unit** for all three.

---

## Ships From Country [ships_from_country]

**Optional** for each product.

### Format
| Field | Value |
|---|---|
| Type | String |
| Limits | 2 characters, ISO 3166-1 Alpha-2 country code |
| Repeated | No |

---

## Handling Time [max_handling_time/min_handling_time]

**Optional.** Standalone attributes for handling time (business days).

### Format
| Field | Value |
|---|---|
| Type | Number (whole number) |
| Repeated | No |

### Important
- If both standalone attributes **and** shipping sub-attributes for handling time are present, **shipping sub-attributes win.**
- Use **business days** (default Mon–Fri).
- Submit **0** if products can ship same day before cutoff.

---

## Shipping Transit Business Days [shipping_transit_business_days]

**Optional.** Use when carrier transit days differ from default Mon–Sat.

### Format
| Field | Value |
|---|---|
| Type | Days of week, semicolon-separated or range with dash |
| Supported values | M/Mon/Monday, T/Tue/Tuesday, W/Wed/Wednesday, R/Thu/Thursday, F/Fri/Friday, S/Sat/Saturday, U/Sun/Sunday |
| Repeated | No |

### Examples
- Per day: `M;W;R;F;S`
- Range: `M-F`
- Mixed: `Mon;Wed-Fri`
- With country: `US:MWRFS`

### Default
Mon–Sat if not specified.

---

## Shipping Handling Business Days [shipping_handling_business_days]

**Optional.** Use when your fulfillment days differ from default Mon–Sat.

### Format
Same as `shipping_transit_business_days`.

### Default
Mon–Fri if not specified.

---

## Free Shipping Threshold [free_shipping_threshold]

**Optional/Depends.** Minimum order cost above which shipping is free.

### Sub-attributes
- **country** (Required): ISO 3166-1 code
- **price_threshold** (Required): Minimum order amount + currency (e.g., "100.00 USD")

### Format
| Field | Value |
|---|---|
| Type | Number plus currency (ISO 4217) |
| Repeated | Up to 25 times per product |

### Important
- If used, the `shipping` attribute should represent **only a single service level** per country.
- Currency must match the offer's **price currency.**
- Threshold uses the **base price** attribute value.

---

## Return Policy Label [return_policy_label]

**Optional** for all products.

### Format
| Field | Value |
|---|---|
| Type | Unicode characters (Recommended: ASCII only) |
| Limits | Max 100 characters |
| Repeated | No |

### Purpose
- Apply a **non-default return policy** to specific products.
- If no value provided, **default return policy** applies.

### Best Practices
- Useful for different return windows by **product category** (e.g., 14-day for electronics).
- Useful for **seasonal** return policy changes.

---

## Quick Reference: Shipping Attributes Summary

| Attribute | Type | Purpose |
|---|---|---|
| shipping | Complex, up to 100× | Primary shipping cost + speed |
| carrier_shipping | Complex, up to 10× | Carrier-calculated cost + speed |
| shipping_label | String | Group products for shipping rates |
| shipping_weight | Number + unit | Weight for carrier-calculated rates |
| shipping_length/width/height | Number + unit | Dimensions for carrier rates |
| ships_from_country | ISO 3166-1 | Country of origin |
| max_handling_time | Integer | Days to hand off to carrier |
| min_handling_time | Integer | Minimum days to hand off |
| shipping_transit_business_days | Day codes | Carrier delivery days of week |
| shipping_handling_business_days | Day codes | Fulfillment days of week |
| free_shipping_threshold | Country + price | Free shipping minimum order |
| return_policy_label | String | Non-default return policy |
| pause | ads/all | Temporarily stop showing |
