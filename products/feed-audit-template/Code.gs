// =============================================================================
// Feed Audit Tool for Google Sheets
// Automatically grades a product feed pasted into a "Feed Data" sheet.
// Author: Alex Diaz | alexdiaz.me
//
// SETUP: After pasting this script into Extensions > Apps Script, rename the
// project from "Untitled project" to "Feed Audit Tool" using the title field
// at the top of the script editor. This ensures the authorization dialog
// shows "Feed Audit Tool" instead of "Untitled project".
// =============================================================================

// ---------------------------------------------------------------------------
// Menu & Entry Points
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Feed Audit')
    .addItem('Run Full Scan', 'runAuditGeneric')
    .addItem('Run Audit (Google Merchant)', 'runAuditGoogle')
    .addItem('Run Audit (Meta Catalog)', 'runAuditMeta')
    .addItem('Run Audit (Shopify)', 'runAuditShopify')
    .addSeparator()
    .addItem('Clear All Results', 'clearResults')
    .addToUi();
}

function runAuditGeneric() { runAuditWithPicker('generic'); }
function runAuditGoogle()  { runAuditWithPicker('google');  }
function runAuditMeta()    { runAuditWithPicker('meta');    }
function runAuditShopify() { runAuditWithPicker('shopify'); }

var PLATFORM_LABELS = {
  generic: 'Full Scan',
  google:  'Google Merchant',
  meta:    'Meta Catalog',
  shopify: 'Shopify'
};

var AUDIT_TAB_PREFIX = 'Audit —';

/**
 * Prompt the user to pick a source data tab, then run the audit.
 * If only one eligible tab exists, skip the prompt and use it directly.
 */
function runAuditWithPicker(platform) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  // Find all non-audit tabs that could contain feed data
  var sheets = ss.getSheets();
  var dataTabs = [];
  for (var s = 0; s < sheets.length; s++) {
    var name = sheets[s].getName();
    if (name.indexOf(AUDIT_TAB_PREFIX) === 0) continue; // skip audit result tabs
    if (name === 'Audit Results') continue; // skip legacy tab
    if (sheets[s].getLastRow() >= 2 && sheets[s].getLastColumn() >= 2) {
      dataTabs.push(name);
    }
  }

  if (dataTabs.length === 0) {
    ui.alert('Error', 'No data tabs found.\n\nPaste your product feed into a sheet (row 1 = headers, row 2+ = data).', ui.ButtonSet.OK);
    return;
  }

  var feedSheetName;
  if (dataTabs.length === 1) {
    feedSheetName = dataTabs[0];
  } else {
    // Build a numbered list for the user to pick from
    var prompt = 'Multiple data tabs found. Enter the number of the tab to audit:\n\n';
    for (var d = 0; d < dataTabs.length; d++) {
      prompt += (d + 1) + '. ' + dataTabs[d] + '\n';
    }
    var resp = ui.prompt('Select Source Tab', prompt, ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() !== ui.Button.OK) return;

    var choice = parseInt(resp.getResponseText().trim(), 10);
    if (isNaN(choice) || choice < 1 || choice > dataTabs.length) {
      ui.alert('Error', 'Invalid selection. Please enter a number between 1 and ' + dataTabs.length + '.', ui.ButtonSet.OK);
      return;
    }
    feedSheetName = dataTabs[choice - 1];
  }

  runAudit(platform, feedSheetName);
}

function clearResults() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var deleted = 0;
  var sheets = ss.getSheets();
  for (var s = sheets.length - 1; s >= 0; s--) {
    var name = sheets[s].getName();
    if (name.indexOf(AUDIT_TAB_PREFIX) === 0 || name === 'Audit Results') {
      ss.deleteSheet(sheets[s]);
      deleted++;
    }
  }

  var ui = SpreadsheetApp.getUi();
  if (deleted > 0) {
    ui.alert(deleted + ' audit tab(s) cleared.');
  } else {
    ui.alert('No audit tabs found.');
  }
}

// ---------------------------------------------------------------------------
// Column Alias Map
// ---------------------------------------------------------------------------

var COLUMN_ALIASES = {
  id:                        ['id', 'item_id', 'product_id', 'offer_id', 'sku', 'ID', 'content_id'],
  title:                     ['title', 'product_title', 'name', 'product_name', 'Title', 'Name', 'item_title'],
  description:               ['description', 'body_html', 'body', 'desc', 'Description', 'product_description'],
  price:                     ['price', 'regular_price', 'Price', 'unit_price', 'retail_price', 'Variant Price'],
  sale_price:                ['sale_price', 'special_price', 'Sale Price', 'Compare At Price'],
  availability:              ['availability', 'stock_status', 'Availability', 'inventory_status', 'Status'],
  image_link:                ['image_link', 'image_url', 'image', 'primary_image', 'Image Src', 'image_src'],
  link:                      ['link', 'product_url', 'url', 'URL', 'Link', 'canonical_url'],
  gtin:                      ['gtin', 'upc', 'ean', 'isbn', 'barcode', 'UPC', 'EAN', 'GTIN', 'Barcode', 'Variant Barcode'],
  brand:                     ['brand', 'vendor', 'Brand', 'Vendor', 'manufacturer', 'brand_name', 'product_brand'],
  mpn:                       ['mpn', 'MPN', 'manufacturer_part_number'],
  condition:                 ['condition', 'Condition', 'product_condition'],
  google_product_category:   ['google_product_category', 'category', 'Category', 'product_category', 'Google Product Category'],
  product_type:              ['product_type', 'Type', 'Product Type', 'category_path'],
  handle:                    ['handle', 'Handle', 'url_handle'],
  variant_sku:               ['variant_sku', 'sku', 'SKU', 'Variant SKU'],
  custom_label_0:            ['custom_label_0', 'Custom Label 0'],
  custom_label_1:            ['custom_label_1', 'Custom Label 1'],
  custom_label_2:            ['custom_label_2', 'Custom Label 2'],
  custom_label_3:            ['custom_label_3', 'Custom Label 3'],
  custom_label_4:            ['custom_label_4', 'Custom Label 4'],
  additional_image_link:     ['additional_image_link', 'additional_images', 'additional_image_links', 'Image Src 2', 'extra_image', 'extra_images'],
  sale_price_effective_date: ['sale_price_effective_date', 'Sale Price Effective Date'],
  shipping_weight:           ['shipping_weight', 'weight', 'Weight', 'Variant Grams', 'shipping_weight_value'],
  shipping_price:            ['shipping', 'shipping_price', 'shipping_cost', 'Shipping'],
  content_id:                ['content_id', 'retailer_product_id', 'Content ID'],
  color:                     ['color', 'colour', 'Color', 'Colour', 'Option1 Value', 'color_name'],
  material:                  ['material', 'Material', 'fabric', 'Fabric'],
  pattern:                   ['pattern', 'Pattern', 'print'],
  size:                      ['size', 'Size', 'Option2 Value', 'size_value', 'product_size'],
  gender:                    ['gender', 'Gender', 'target_gender'],
  age_group:                 ['age_group', 'ageGroup', 'Age Group', 'target_age_group'],
  item_group_id:             ['item_group_id', 'Item Group ID', 'item_group', 'parent_id', 'group_id'],
  short_title:               ['short_title', 'Short Title', 'short_name'],
  promotion_id:              ['promotion_id', 'Promotion ID', 'promo_id'],
  cost_of_goods_sold:        ['cost_of_goods_sold', 'cogs', 'COGS', 'Cost of Goods Sold', 'cost_of_goods'],
  expiration_date:           ['expiration_date', 'Expiration Date', 'expiry_date', 'expiry'],
  unit_pricing_measure:      ['unit_pricing_measure', 'Unit Pricing Measure'],
  unit_pricing_base_measure: ['unit_pricing_base_measure', 'Unit Pricing Base Measure'],
  availability_date:         ['availability_date', 'Availability Date', 'preorder_date'],
  identifier_exists:         ['identifier_exists', 'Identifier Exists'],
  multipack:                 ['multipack', 'Multipack'],
  is_bundle:                 ['is_bundle', 'Is Bundle', 'bundle'],
  adult:                     ['adult', 'Adult'],
  size_type:                 ['size_type', 'Size Type', 'sizeType'],
  size_system:               ['size_system', 'Size System', 'sizeSystem'],
  ads_redirect:              ['ads_redirect', 'Ads Redirect', 'adwords_redirect']
};

// Fields where partial matching (header contains alias) should be used as a fallback
var PARTIAL_MATCH_FIELDS = ['brand'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a map: logical field name -> column index (0-based), or -1 if not found.
 */
function buildColumnMap(headers) {
  var map = {};
  var lowerHeaders = headers.map(function(h) { return String(h).trim().toLowerCase(); });

  for (var field in COLUMN_ALIASES) {
    map[field] = -1;
    var aliases = COLUMN_ALIASES[field];
    // Step 1: Exact match
    for (var a = 0; a < aliases.length; a++) {
      var idx = lowerHeaders.indexOf(aliases[a].toLowerCase());
      if (idx !== -1) {
        map[field] = idx;
        break;
      }
    }
    // Step 2: Partial match fallback for designated fields (e.g., brand)
    if (map[field] === -1 && PARTIAL_MATCH_FIELDS.indexOf(field) !== -1) {
      for (var h = 0; h < lowerHeaders.length; h++) {
        for (var a2 = 0; a2 < aliases.length; a2++) {
          if (lowerHeaders[h].indexOf(aliases[a2].toLowerCase()) !== -1) {
            map[field] = h;
            break;
          }
        }
        if (map[field] !== -1) break;
      }
    }
  }

  // Step 3: Variant ID fallback — if no ID column found, look for variant_id columns
  map._idAssumedFromVariant = false;
  if (map.id === -1) {
    var variantIdAliases = ['variant_id', 'variantid', 'variant id', 'shopify_variant_id', 'variant_sku'];
    for (var v = 0; v < variantIdAliases.length; v++) {
      var vidx = lowerHeaders.indexOf(variantIdAliases[v]);
      if (vidx !== -1) {
        map.id = vidx;
        map._idAssumedFromVariant = true;
        break;
      }
    }
    // Also try partial match for variant_id
    if (map.id === -1) {
      for (var h2 = 0; h2 < lowerHeaders.length; h2++) {
        if (lowerHeaders[h2].indexOf('variant') !== -1 && lowerHeaders[h2].indexOf('id') !== -1) {
          map.id = h2;
          map._idAssumedFromVariant = true;
          break;
        }
      }
    }
  }

  return map;
}

/**
 * Safely get cell value as trimmed string; returns '' for null/undefined.
 */
function cellStr(row, colIdx) {
  if (colIdx < 0 || colIdx >= row.length) return '';
  var v = row[colIdx];
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

/**
 * Parse a numeric price from a cell value, stripping currency symbols/codes.
 */
function parsePrice(raw) {
  if (raw === '' || raw === null || raw === undefined) return NaN;
  var s = String(raw).replace(/[^0-9.\-]/g, '');
  if (s === '') return NaN;
  return parseFloat(s);
}

/**
 * Compute median of a numeric array (ignores NaN).
 */
function median(arr) {
  var valid = arr.filter(function(v) { return !isNaN(v) && v > 0; });
  if (valid.length === 0) return 0;
  valid.sort(function(a, b) { return a - b; });
  var mid = Math.floor(valid.length / 2);
  if (valid.length % 2 === 0) return (valid[mid - 1] + valid[mid]) / 2;
  return valid[mid];
}

/**
 * Format a number with commas (e.g. 1234 -> "1,234").
 */
function fmtNum(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Return percentage string like "12.3%".
 */
function pct(count, total) {
  if (total === 0) return '0%';
  return (count / total * 100).toFixed(1) + '%';
}

// ---------------------------------------------------------------------------
// GTIN / ISBN Check Digit Validation
// ---------------------------------------------------------------------------

/**
 * Validate GS1 check digit for GTIN-8, UPC-12, EAN-13, GTIN-14, and ISBN-13.
 * Returns true if check digit is valid, false otherwise.
 */
function validateGTINCheckDigit(digits) {
  var len = digits.length;
  if (len !== 8 && len !== 12 && len !== 13 && len !== 14) return false;

  var sum = 0;
  for (var i = 0; i < len - 1; i++) {
    var d = parseInt(digits[i], 10);
    if (isNaN(d)) return false;
    // Weight alternates: for GTIN the rightmost digit (before check) gets weight 3,
    // then 1, then 3, etc. counting from right to left.
    var weight = ((len - 1 - i) % 2 === 0) ? 1 : 3;
    sum += d * weight;
  }

  var checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(digits[len - 1], 10);
}

/**
 * Validate ISBN-10 check digit (modulo 11).
 * The last character can be 0-9 or 'X' (representing 10).
 */
function validateISBN10CheckDigit(digits) {
  if (digits.length !== 10) return false;

  var sum = 0;
  for (var i = 0; i < 9; i++) {
    var d = parseInt(digits[i], 10);
    if (isNaN(d)) return false;
    sum += d * (10 - i);
  }

  var lastChar = digits[9].toUpperCase();
  var checkVal = (lastChar === 'X') ? 10 : parseInt(lastChar, 10);
  if (isNaN(checkVal) && lastChar !== 'X') return false;

  return (sum + checkVal) % 11 === 0;
}

// ---------------------------------------------------------------------------
// Check Result Builder
// ---------------------------------------------------------------------------

var MAX_EXAMPLES = 5;

/**
 * Get the gid (sheet ID) of a sheet by name, used for constructing in-spreadsheet hyperlinks.
 */
function getFeedSheetGid(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return 0;
  return sheet.getSheetId();
}

/**
 * Build a result row. `examples` is an array of {row, label, value} objects.
 * We store up to MAX_EXAMPLES and the raw examples array for writeResults to create hyperlinks.
 */
function makeResult(category, check, severity, status, details, affected, total, examples) {
  return {
    data: [
      category,
      check,
      severity,
      status,
      details,
      affected,
      total > 0 ? pct(affected, total) : ''
    ],
    examples: examples ? examples.slice(0, MAX_EXAMPLES) : []
  };
}

/**
 * Collect a structured example for a failing row.
 * rowIdx is 0-based index into the data rows array (row 2+ in the sheet).
 */
/**
 * Collect a structured example for a failing row.
 * @param {number} rowIdx - 0-based index into data rows array
 * @param {Array} rows - all data rows
 * @param {Object} colMap - column mapping
 * @param {string} badValue - the problematic value to display
 * @param {number} [colIdx] - 0-based column index of the problematic field (for deep-linking to exact cell)
 */
function exampleObj(rowIdx, rows, colMap, badValue, colIdx) {
  var id = colMap.id >= 0 ? cellStr(rows[rowIdx], colMap.id) : '';
  var label = id ? id : 'Row ' + (rowIdx + 2);
  var sheetRow = rowIdx + 2; // +2 because: +1 for header, +1 for 1-based
  // Convert 0-based colIdx to column letter (A, B, C, ... Z, AA, AB, ...)
  var colLetter = 'A';
  if (colIdx !== undefined && colIdx >= 0) {
    colLetter = getColumnLetter(colIdx);
  }
  return {
    row: sheetRow,
    col: colLetter,
    label: label,
    value: badValue !== undefined ? String(badValue).substring(0, 60) : ''
  };
}

function getColumnLetter(idx) {
  var letter = '';
  var n = idx;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

// ---------------------------------------------------------------------------
// Main Audit Runner
// ---------------------------------------------------------------------------

function runAudit(platform, feedSheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  // --- Validate source sheet ---
  var feedSheet = ss.getSheetByName(feedSheetName);
  if (!feedSheet) {
    ui.alert('Error', 'Sheet "' + feedSheetName + '" not found.', ui.ButtonSet.OK);
    return;
  }

  var lastRow = feedSheet.getLastRow();
  var lastCol = feedSheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    ui.alert('Error', 'The "' + feedSheetName + '" sheet appears to be empty.\n\nPaste your feed data with headers in row 1 and product rows starting at row 2.', ui.ButtonSet.OK);
    return;
  }

  // --- Read data ---
  var allData = feedSheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = allData[0];
  var rows = allData.slice(1);
  var total = rows.length;

  ss.toast('Analyzing ' + fmtNum(total) + ' products...', 'Feed Audit', 5);

  var colMap = buildColumnMap(headers);

  // Quick sanity: warn if no ID column (variant_id fallback may have kicked in)
  if (colMap.id === -1) {
    var resp = ui.alert(
      'Warning',
      'Could not find an ID column (looked for: id, item_id, product_id, offer_id, sku, content_id, variant_id).\n\nSome checks will be skipped. Continue anyway?',
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) return;
  }

  // --- Run checks ---
  var results = [];

  ss.toast('Running checks...', 'Feed Audit', 10);

  // Note if variant ID was used as fallback
  if (colMap._idAssumedFromVariant) {
    results.push(makeResult('Info', 'ID column assumption', 'Low', 'WARNING',
      'No standard ID column found. Using variant ID column (col ' + getColumnLetter(colMap.id) + ') as unique identifier. Variant IDs may not be unique across parent products — verify duplicates carefully.',
      0, total, []));
  }

  // ===== Required Fields =====
  results = results.concat(checkRequiredFields(rows, colMap, total));

  // ===== Title Quality =====
  results = results.concat(checkTitleQuality(rows, colMap, total));

  // ===== Description Quality =====
  results = results.concat(checkDescriptionQuality(rows, colMap, total));

  // ===== Image Quality =====
  results = results.concat(checkImageQuality(rows, colMap, total));

  // ===== Additional Image Quality =====
  results = results.concat(checkAdditionalImages(rows, colMap, total));

  // ===== Link Quality =====
  results = results.concat(checkLinkQuality(rows, colMap, total));

  // ===== Pricing =====
  results = results.concat(checkPricing(rows, colMap, total));

  // ===== Availability =====
  results = results.concat(checkAvailability(rows, colMap, total));

  // ===== Feed Freshness =====
  results = results.concat(checkFeedFreshness(rows, colMap, total));

  // ===== Attributes (Color, Material, Pattern, Size) =====
  results = results.concat(checkAttributes(rows, colMap, total));

  // ===== Gender & Age Group =====
  results = results.concat(checkGenderAgeGroup(rows, colMap, total));

  // ===== Shipping =====
  results = results.concat(checkShipping(rows, colMap, total));

  // ===== Sale Price Effective Date =====
  results = results.concat(checkSalePriceDate(rows, colMap, total));

  // ===== Item Group ID =====
  results = results.concat(checkItemGroupId(rows, colMap, total));

  // ===== Google Merchant Specific =====
  if (platform === 'google' || platform === 'generic') {
    results = results.concat(checkGoogleMerchant(rows, colMap, total, platform));
  }

  // ===== Meta Specific =====
  if (platform === 'meta' || platform === 'generic') {
    results = results.concat(checkMeta(rows, colMap, total, platform));
  }

  // ===== Shopify Specific =====
  if (platform === 'shopify' || platform === 'generic') {
    results = results.concat(checkShopify(rows, colMap, total, platform));
  }

  // --- Write results ---
  var platformLabel = PLATFORM_LABELS[platform] || PLATFORM_LABELS.generic;
  var tabName = AUDIT_TAB_PREFIX + ' ' + platformLabel + ' — ' + feedSheetName;
  // Google Sheets tab names max 100 chars
  if (tabName.length > 100) tabName = tabName.substring(0, 100);
  ss.toast('Writing results...', 'Feed Audit', 5);
  writeResults(ss, results, total, platform, tabName, feedSheetName);

  ss.toast('Done! See the "' + tabName + '" tab.', 'Feed Audit', 5);
}

// ---------------------------------------------------------------------------
// Check: Required Fields
// ---------------------------------------------------------------------------

function checkRequiredFields(rows, colMap, total) {
  var results = [];

  // --- Title ---
  if (colMap.title === -1) {
    results.push(makeResult('Required Fields', 'Title present', 'Critical', 'SKIP', 'Title column not found in feed.', 0, total, []));
  } else {
    var blanks = 0, blankEx = [];
    var lengthViolations = 0, lengthEx = [];
    var promoViolations = 0, promoEx = [];
    var promoRegex = /\b(sale|free shipping|discount|buy one|bogo|%\s*off)\b/i;

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.title);
      if (v === '') { blanks++; blankEx.push(exampleObj(i, rows, colMap, '(empty)', colMap.title)); continue; }
      if (v.length < 25 || v.length > 150) { lengthViolations++; lengthEx.push(exampleObj(i, rows, colMap, v.length + ' chars: "' + v.substring(0, 50) + '"', colMap.title)); }
      if (promoRegex.test(v)) { promoViolations++; promoEx.push(exampleObj(i, rows, colMap, v.substring(0, 60), colMap.title)); }
    }

    results.push(makeResult('Required Fields', 'Title present', 'Critical',
      blanks === 0 ? 'PASS' : 'FAIL',
      blanks === 0 ? 'All products have titles.' : blanks + ' product(s) missing title.',
      blanks, total, blankEx));

    results.push(makeResult('Required Fields', 'Title length (25-150 chars)', 'Medium',
      lengthViolations === 0 ? 'PASS' : 'WARNING',
      lengthViolations === 0 ? 'All titles within recommended length.' : lengthViolations + ' title(s) outside 25-150 character range.',
      lengthViolations, total, lengthEx));

    results.push(makeResult('Required Fields', 'Title no promotional text', 'High',
      promoViolations === 0 ? 'PASS' : 'FAIL',
      promoViolations === 0 ? 'No promotional text detected in titles.' : promoViolations + ' title(s) contain promotional text (sale, discount, free shipping, etc.).',
      promoViolations, total, promoEx));
  }

  // --- Description ---
  if (colMap.description === -1) {
    results.push(makeResult('Required Fields', 'Description present', 'Critical', 'SKIP', 'Description column not found in feed.', 0, total, []));
  } else {
    var descBlanks = 0, descBlankEx = [];
    var descLengthViolations = 0, descLenEx = [];
    var descHtmlViolations = 0, descHtmlEx = [];
    var htmlRegex = /<[^>]+>/;

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.description);
      if (v === '') { descBlanks++; descBlankEx.push(exampleObj(i, rows, colMap, '(empty)', colMap.description)); continue; }
      if (v.length < 100 || v.length > 5000) { descLengthViolations++; descLenEx.push(exampleObj(i, rows, colMap, v.length + ' chars', colMap.description)); }
      if (htmlRegex.test(v)) { var match = v.match(htmlRegex); descHtmlViolations++; descHtmlEx.push(exampleObj(i, rows, colMap, match[0], colMap.description)); }
    }

    results.push(makeResult('Required Fields', 'Description present', 'Critical',
      descBlanks === 0 ? 'PASS' : 'FAIL',
      descBlanks === 0 ? 'All products have descriptions.' : descBlanks + ' product(s) missing description.',
      descBlanks, total, descBlankEx));

    results.push(makeResult('Required Fields', 'Description length (100-5000 chars)', 'Medium',
      descLengthViolations === 0 ? 'PASS' : 'WARNING',
      descLengthViolations === 0 ? 'All descriptions within recommended length.' : descLengthViolations + ' description(s) outside 100-5000 character range.',
      descLengthViolations, total, descLenEx));

    results.push(makeResult('Required Fields', 'Description no HTML tags', 'High',
      descHtmlViolations === 0 ? 'PASS' : 'FAIL',
      descHtmlViolations === 0 ? 'No HTML tags detected in descriptions.' : descHtmlViolations + ' description(s) contain HTML tags.',
      descHtmlViolations, total, descHtmlEx));
  }

  // --- Price ---
  if (colMap.price === -1) {
    results.push(makeResult('Required Fields', 'Price present and valid', 'Critical', 'SKIP', 'Price column not found in feed.', 0, total, []));
  } else {
    var priceBlanks = 0, priceBlankEx = [];
    var priceInvalid = 0, priceInvEx = [];

    for (var i = 0; i < rows.length; i++) {
      var raw = cellStr(rows[i], colMap.price);
      if (raw === '') { priceBlanks++; priceBlankEx.push(exampleObj(i, rows, colMap, '(empty)', colMap.price)); continue; }
      var num = parsePrice(raw);
      if (isNaN(num) || num <= 0) { priceInvalid++; priceInvEx.push(exampleObj(i, rows, colMap, raw, colMap.price)); }
    }

    results.push(makeResult('Required Fields', 'Price present', 'Critical',
      priceBlanks === 0 ? 'PASS' : 'FAIL',
      priceBlanks === 0 ? 'All products have a price.' : priceBlanks + ' product(s) missing price.',
      priceBlanks, total, priceBlankEx));

    results.push(makeResult('Required Fields', 'Price valid format (> 0)', 'Critical',
      priceInvalid === 0 ? 'PASS' : 'FAIL',
      priceInvalid === 0 ? 'All prices are valid positive numbers.' : priceInvalid + ' product(s) have invalid or non-positive price.',
      priceInvalid, total, priceInvEx));
  }

  // --- Availability ---
  if (colMap.availability === -1) {
    results.push(makeResult('Required Fields', 'Availability present', 'Critical', 'SKIP', 'Availability column not found in feed.', 0, total, []));
  } else {
    var availBlanks = 0, availBlankEx = [];
    var availInvalid = 0, availInvEx = [];
    var validAvail = ['in_stock', 'in stock', 'out_of_stock', 'out of stock', 'preorder', 'pre-order', 'pre order', 'backorder', 'back order', 'back_order', 'active', 'draft', 'archived'];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.availability).toLowerCase();
      if (v === '') { availBlanks++; availBlankEx.push(exampleObj(i, rows, colMap, '(empty)', colMap.availability)); continue; }
      if (validAvail.indexOf(v) === -1) { availInvalid++; availInvEx.push(exampleObj(i, rows, colMap, v, colMap.availability)); }
    }

    results.push(makeResult('Required Fields', 'Availability present', 'Critical',
      availBlanks === 0 ? 'PASS' : 'FAIL',
      availBlanks === 0 ? 'All products have availability set.' : availBlanks + ' product(s) missing availability.',
      availBlanks, total, availBlankEx));

    results.push(makeResult('Required Fields', 'Availability valid values', 'High',
      availInvalid === 0 ? 'PASS' : 'FAIL',
      availInvalid === 0 ? 'All availability values are recognized.' : availInvalid + ' product(s) have unrecognized availability values.',
      availInvalid, total, availInvEx));
  }

  // --- Image Link ---
  if (colMap.image_link === -1) {
    results.push(makeResult('Required Fields', 'Image link present', 'Critical', 'SKIP', 'Image link column not found in feed.', 0, total, []));
  } else {
    var imgBlanks = 0, imgBlankEx = [];
    var imgInvalid = 0, imgInvEx = [];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.image_link);
      if (v === '') { imgBlanks++; imgBlankEx.push(exampleObj(i, rows, colMap, '(empty)', colMap.image_link)); continue; }
      if (!/^https?:\/\//i.test(v)) { imgInvalid++; imgInvEx.push(exampleObj(i, rows, colMap, v, colMap.image_link)); }
    }

    results.push(makeResult('Required Fields', 'Image link present', 'Critical',
      imgBlanks === 0 ? 'PASS' : 'FAIL',
      imgBlanks === 0 ? 'All products have an image link.' : imgBlanks + ' product(s) missing image link.',
      imgBlanks, total, imgBlankEx));

    results.push(makeResult('Required Fields', 'Image link valid URL', 'High',
      imgInvalid === 0 ? 'PASS' : 'FAIL',
      imgInvalid === 0 ? 'All image links are valid URLs.' : imgInvalid + ' image link(s) do not start with http:// or https://.',
      imgInvalid, total, imgInvEx));
  }

  // --- Product URL ---
  if (colMap.link === -1) {
    results.push(makeResult('Required Fields', 'Product URL present', 'Critical', 'SKIP', 'Product URL / link column not found in feed.', 0, total, []));
  } else {
    var linkBlanks = 0, linkEx = [];
    for (var i = 0; i < rows.length; i++) {
      if (cellStr(rows[i], colMap.link) === '') { linkBlanks++; linkEx.push(exampleObj(i, rows, colMap, '(empty)', colMap.link)); }
    }

    results.push(makeResult('Required Fields', 'Product URL present', 'Critical',
      linkBlanks === 0 ? 'PASS' : 'FAIL',
      linkBlanks === 0 ? 'All products have a product URL.' : linkBlanks + ' product(s) missing product URL.',
      linkBlanks, total, linkEx));
  }

  // --- Unique IDs ---
  if (colMap.id === -1) {
    results.push(makeResult('Required Fields', 'Unique IDs', 'Critical', 'SKIP', 'ID column not found in feed.', 0, total, []));
  } else {
    var ids = {};
    var dupeCount = 0, dupeEx = [];
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.id);
      if (v === '') continue;
      if (ids[v]) { dupeCount++; dupeEx.push(exampleObj(i, rows, colMap, 'duplicate: ' + v, colMap.id)); }
      ids[v] = true;
    }

    results.push(makeResult('Required Fields', 'Unique IDs (no duplicates)', 'Critical',
      dupeCount === 0 ? 'PASS' : 'FAIL',
      dupeCount === 0 ? 'All product IDs are unique.' : dupeCount + ' duplicate ID(s) found.',
      dupeCount, total, dupeEx));

    // ID max 50 characters (Google hard limit)
    var idLongCount = 0, idLongEx = [];
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.id);
      if (v.length > 50) {
        idLongCount++;
        if (idLongEx.length < MAX_EXAMPLES) idLongEx.push(exampleObj(i, rows, colMap, v.length + ' chars', colMap.id));
      }
    }
    results.push(makeResult('Required Fields', 'ID max 50 characters', 'High',
      idLongCount === 0 ? 'PASS' : 'FAIL',
      idLongCount === 0 ? 'All IDs are within 50 characters.' : idLongCount + ' ID(s) exceed 50 characters. Google will reject these.',
      idLongCount, total, idLongEx));

    // ID: non-ASCII characters (Google recommends ASCII only, invalid unicode = rejection)
    var idNonAscii = 0, idNonAsciiEx = [];
    // eslint-disable-next-line no-control-regex
    var nonAsciiRegex = /[^\x20-\x7E]/;
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.id);
      if (v === '') continue;
      if (nonAsciiRegex.test(v)) {
        idNonAscii++;
        if (idNonAsciiEx.length < MAX_EXAMPLES) idNonAsciiEx.push(exampleObj(i, rows, colMap, v.substring(0, 40), colMap.id));
      }
    }
    results.push(makeResult('Required Fields', 'ID ASCII characters only', 'High',
      idNonAscii === 0 ? 'PASS' : 'FAIL',
      idNonAscii === 0 ? 'All IDs use ASCII characters only.' : idNonAscii + ' ID(s) contain non-ASCII characters. Google recommends ASCII only (alphanumeric, underscores, dashes). Invalid unicode causes rejection.',
      idNonAscii, total, idNonAsciiEx));

    // ID: whitespace issues (leading, trailing, or consecutive spaces)
    var idWhitespace = 0, idWsEx = [];
    for (var i = 0; i < rows.length; i++) {
      var raw = (colMap.id >= 0 && colMap.id < rows[i].length) ? String(rows[i][colMap.id]) : '';
      if (raw === '') continue;
      if (raw !== raw.trim() || /\s{2,}/.test(raw)) {
        idWhitespace++;
        if (idWsEx.length < MAX_EXAMPLES) idWsEx.push(exampleObj(i, rows, colMap, '"' + raw.substring(0, 30) + '"', colMap.id));
      }
    }
    results.push(makeResult('Required Fields', 'ID no extra whitespace', 'Medium',
      idWhitespace === 0 ? 'PASS' : 'WARNING',
      idWhitespace === 0 ? 'No whitespace issues in IDs.' : idWhitespace + ' ID(s) have leading/trailing or consecutive whitespace. Google auto-strips whitespace, which may cause unexpected ID changes.',
      idWhitespace, total, idWsEx));

    // ID: case-only differentiation (two IDs that differ only by casing)
    var caseDupes = 0;
    var lowerIds = {};
    for (var key in ids) {
      var lower = key.toLowerCase();
      if (lowerIds[lower]) { caseDupes++; }
      lowerIds[lower] = true;
    }
    results.push(makeResult('Required Fields', 'ID no case-only differentiation', 'High',
      caseDupes === 0 ? 'PASS' : 'WARNING',
      caseDupes === 0 ? 'No IDs differ only by casing.' : caseDupes + ' ID pair(s) differ only by casing. Google warns these may be confused in Ads filtering and supplemental feed matching.',
      caseDupes, total, []));
  }

  // --- Condition ---
  if (colMap.condition === -1) {
    results.push(makeResult('Required Fields', 'Condition present', 'Medium', 'SKIP', 'Condition column not found in feed.', 0, total, []));
  } else {
    var condBlanks = 0;
    var condInvalid = 0, condEx = [];
    var validCond = ['new', 'refurbished', 'used'];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.condition).toLowerCase();
      if (v === '') { condBlanks++; continue; }
      if (validCond.indexOf(v) === -1) { condInvalid++; condEx.push(exampleObj(i, rows, colMap, v, colMap.condition)); }
    }

    var condAffected = condBlanks + condInvalid;
    results.push(makeResult('Required Fields', 'Condition present and valid', 'Medium',
      condAffected === 0 ? 'PASS' : (condBlanks > 0 ? 'WARNING' : 'FAIL'),
      (condBlanks > 0 ? condBlanks + ' missing. ' : '') + (condInvalid > 0 ? condInvalid + ' invalid value(s) (expected: new, refurbished, used).' : (condBlanks === 0 ? 'All conditions valid.' : '')),
      condAffected, total, condEx));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check: Image Quality
// ---------------------------------------------------------------------------

function checkImageQuality(rows, colMap, total) {
  var results = [];

  if (colMap.image_link === -1) {
    results.push(makeResult('Image Quality', 'Images use HTTPS', 'High', 'SKIP', 'Image link column not found.', 0, total, []))
    results.push(makeResult('Image Quality', 'No placeholder images', 'High', 'SKIP', 'Image link column not found.', 0, total, []))
    return results;
  }

  var httpCount = 0, httpEx = [];
  var placeholderCount = 0, placeholderEx = [];
  var imgTooLong = 0, imgTooLongEx = [];
  var imgBadExt = 0, imgBadExtEx = [];
  var placeholderRegex = /placeholder|no[_\-]?image|coming[_\-]?soon|default\.jpg|noimage/i;
  var validImgExtRegex = /\.(jpe?g|webp|png|gif|bmp|tiff?)(\?|$)/i;

  for (var i = 0; i < rows.length; i++) {
    var v = cellStr(rows[i], colMap.image_link);
    if (v === '') continue;
    if (/^http:\/\//i.test(v)) {
      httpCount++;
      if (httpEx.length < MAX_EXAMPLES) httpEx.push(exampleObj(i, rows, colMap, v.substring(0, 60), colMap.image_link));
    }
    if (placeholderRegex.test(v)) {
      placeholderCount++;
      if (placeholderEx.length < MAX_EXAMPLES) placeholderEx.push(exampleObj(i, rows, colMap, v.substring(0, 60), colMap.image_link));
    }
    // Image URL max 2,000 characters
    if (v.length > 2000) {
      imgTooLong++;
      if (imgTooLongEx.length < MAX_EXAMPLES) imgTooLongEx.push(exampleObj(i, rows, colMap, v.length + ' chars', colMap.image_link));
    }
    // Supported file format check (extension in URL)
    // Strip query params for extension check, but only warn if URL has a recognizable path
    var urlPath = v.split('?')[0];
    if (urlPath.lastIndexOf('.') > urlPath.lastIndexOf('/') && !validImgExtRegex.test(v)) {
      imgBadExt++;
      if (imgBadExtEx.length < MAX_EXAMPLES) {
        var ext = urlPath.substring(urlPath.lastIndexOf('.'));
        imgBadExtEx.push(exampleObj(i, rows, colMap, 'Extension: ' + ext.substring(0, 10), colMap.image_link));
      }
    }
  }

  results.push(makeResult('Image Quality', 'Images use HTTPS', 'High',
    httpCount === 0 ? 'PASS' : 'FAIL',
    httpCount === 0 ? 'All image URLs use HTTPS.' : httpCount + ' image(s) use HTTP instead of HTTPS.',
    httpCount, total, httpEx))

  results.push(makeResult('Image Quality', 'No placeholder images', 'High',
    placeholderCount === 0 ? 'PASS' : 'FAIL',
    placeholderCount === 0 ? 'No placeholder image URLs detected.' : placeholderCount + ' image URL(s) appear to be placeholders.',
    placeholderCount, total, placeholderEx))

  results.push(makeResult('Image Quality', 'Image URL max 2,000 characters', 'High',
    imgTooLong === 0 ? 'PASS' : 'FAIL',
    imgTooLong === 0 ? 'All image URLs are within 2,000 characters.' : imgTooLong + ' image URL(s) exceed 2,000 characters. Google will reject these.',
    imgTooLong, total, imgTooLongEx))

  results.push(makeResult('Image Quality', 'Image supported file format', 'High',
    imgBadExt === 0 ? 'PASS' : 'WARNING',
    imgBadExt === 0 ? 'All image URLs have supported file extensions.' : imgBadExt + ' image URL(s) don\'t end with a supported format (.jpg, .jpeg, .webp, .png, .gif, .bmp, .tiff). Google supports: JPEG, WebP, PNG, GIF, BMP, TIFF.',
    imgBadExt, total, imgBadExtEx))

  return results;
}

// ---------------------------------------------------------------------------
// Check: Pricing
// ---------------------------------------------------------------------------

function checkPricing(rows, colMap, total) {
  var results = [];

  if (colMap.price === -1) {
    results.push(makeResult('Pricing', 'Price consistency (outliers)', 'Medium', 'SKIP', 'Price column not found.', 0, total, []))
    return results;
  }

  // Collect all valid prices for outlier detection
  var prices = [];
  for (var i = 0; i < rows.length; i++) {
    var p = parsePrice(cellStr(rows[i], colMap.price));
    if (!isNaN(p) && p > 0) prices.push(p);
  }

  var med = median(prices);
  var outlierCount = 0;
  if (med > 0) {
    for (var i = 0; i < prices.length; i++) {
      if (prices[i] > med * 10 || prices[i] < med * 0.1) outlierCount++;
    }
  }

  results.push(makeResult('Pricing', 'Price consistency (outliers)', 'Medium',
    outlierCount === 0 ? 'PASS' : 'WARNING',
    outlierCount === 0 ? 'No pricing outliers detected (median: $' + med.toFixed(2) + ').' : outlierCount + ' price(s) are >10x or <0.1x the median ($' + med.toFixed(2) + '). Review for data errors.',
    outlierCount, total, []))

  // Sale price validation
  if (colMap.sale_price === -1) {
    results.push(makeResult('Pricing', 'Sale price < regular price', 'High', 'SKIP', 'Sale price column not found.', 0, total, []))
  } else {
    var salePriceErrors = 0;
    var salePriceRows = 0;

    for (var i = 0; i < rows.length; i++) {
      var sp = parsePrice(cellStr(rows[i], colMap.sale_price));
      if (isNaN(sp) || sp <= 0) continue;
      salePriceRows++;
      var rp = parsePrice(cellStr(rows[i], colMap.price));
      if (!isNaN(rp) && sp >= rp) salePriceErrors++;
    }

    results.push(makeResult('Pricing', 'Sale price < regular price', 'High',
      salePriceErrors === 0 ? 'PASS' : 'FAIL',
      salePriceErrors === 0
        ? 'All sale prices are less than regular prices (' + salePriceRows + ' products with sale prices).'
        : salePriceErrors + ' product(s) have sale price >= regular price.',
      salePriceErrors, total, []))
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check: Availability
// ---------------------------------------------------------------------------

function checkAvailability(rows, colMap, total) {
  var results = [];

  if (colMap.availability === -1) {
    results.push(makeResult('Availability', 'Out-of-stock percentage', 'Medium', 'SKIP', 'Availability column not found.', 0, total, []))
    results.push(makeResult('Availability', 'Availability value distribution', 'Low', 'SKIP', 'Availability column not found.', 0, total, []))
    return results;
  }

  var oosCount = 0;
  var distribution = {};

  for (var i = 0; i < rows.length; i++) {
    var v = cellStr(rows[i], colMap.availability).toLowerCase();
    if (v === '') v = '(blank)';

    // Normalize for distribution display
    distribution[v] = (distribution[v] || 0) + 1;

    if (v === 'out_of_stock' || v === 'out of stock') oosCount++;
  }

  var oosPct = total > 0 ? (oosCount / total * 100) : 0;

  results.push(makeResult('Availability', 'Out-of-stock percentage', 'Medium',
    oosPct <= 50 ? 'PASS' : 'WARNING',
    oosCount + ' of ' + total + ' products (' + oosPct.toFixed(1) + '%) are out of stock.' + (oosPct > 50 ? ' More than 50% OOS may indicate a feed or inventory issue.' : ''),
    oosCount, total, []))

  // Distribution summary
  var distParts = [];
  for (var key in distribution) {
    distParts.push(key + ': ' + distribution[key]);
  }

  results.push(makeResult('Availability', 'Availability value distribution', 'Low', 'PASS',
    distParts.join(' | '), 0, total, []))

  return results;
}

// ---------------------------------------------------------------------------
// Check: Feed Freshness
// ---------------------------------------------------------------------------

function checkFeedFreshness(rows, colMap, total) {
  var results = [];

  // Total product count
  results.push(makeResult('Feed Freshness', 'Total product count', 'Low', 'PASS',
    fmtNum(total) + ' products in feed.', 0, total, []))

  // Duplicate titles
  if (colMap.title === -1) {
    results.push(makeResult('Feed Freshness', 'Potential duplicate titles', 'Medium', 'SKIP', 'Title column not found.', 0, total, []))
  } else {
    var titleCounts = {};
    for (var i = 0; i < rows.length; i++) {
      var t = cellStr(rows[i], colMap.title).toLowerCase();
      if (t === '') continue;
      titleCounts[t] = (titleCounts[t] || 0) + 1;
    }

    var dupeCount = 0;
    var dupeEx = [];
    // Build a map of title -> first row index for examples
    var titleFirstRow = {};
    for (var i = 0; i < rows.length; i++) {
      var t2 = cellStr(rows[i], colMap.title).toLowerCase();
      if (t2 !== '' && !titleFirstRow.hasOwnProperty(t2)) titleFirstRow[t2] = i;
    }
    for (var t in titleCounts) {
      if (titleCounts[t] > 1) {
        dupeCount += titleCounts[t];
        if (dupeEx.length < MAX_EXAMPLES) {
          var rowIdx = titleFirstRow[t] || 0;
          dupeEx.push(exampleObj(rowIdx, rows, colMap, (t.length > 50 ? t.substring(0, 47) + '...' : t) + ' (x' + titleCounts[t] + ')', colMap.title));
        }
      }
    }

    results.push(makeResult('Feed Freshness', 'Potential duplicate titles', 'Medium',
      dupeCount === 0 ? 'PASS' : 'WARNING',
      dupeCount === 0 ? 'No duplicate titles found.' : dupeCount + ' products share duplicate titles.',
      dupeCount, total, dupeEx))
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check: Title Quality (advanced)
// ---------------------------------------------------------------------------

function checkTitleQuality(rows, colMap, total) {
  var results = [];
  if (colMap.title === -1) return results;

  var htmlCount = 0, htmlEx = [];
  var repeatCount = 0, repeatEx = [];
  var casingCount = 0, casingEx = [];
  var specialCharCount = 0, specialCharEx = [];
  var extraWsCount = 0, extraWsEx = [];
  var htmlRegex = /<[^>]+>/;
  // Unicode symbols used for attention-getting that Google may disapprove.
  // BMP special chars + surrogate-pair match for emoji in planes U+1F000 to U+1FBFF.
  // NOTE: do not use \u1F600-style escapes outside a character class with the /u flag;
  // in JS non-u regex, \u1F600 parses as \u1F60 + "0" which creates a range that
  // matches basic ASCII letters and digits. See historical bug in v1.0 of this file.
  var attentionCharsRegex = /[\u2605\u2606\u2764\u2665\u2666\u2660\u2663\u2702\u2714\u2716\u2728\u2733\u2734\u2747\u2756\u2B50\u2B55\u27A1\uFE0F\u25CF\u25CB\u25A0\u25A1\u25B2\u25BC\u2190-\u21FF\u2794-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]/;

  for (var i = 0; i < rows.length; i++) {
    var v = cellStr(rows[i], colMap.title);
    if (v === '') continue;

    // HTML in title
    if (htmlRegex.test(v)) {
      htmlCount++;
      if (htmlEx.length < MAX_EXAMPLES) htmlEx.push(exampleObj(i, rows, colMap, v.match(htmlRegex)[0], colMap.title));
    }

    // Repeating words (same word appears 3+ times)
    var words = v.toLowerCase().split(/\s+/);
    var wordCounts = {};
    var hasRepeat = false;
    for (var w = 0; w < words.length; w++) {
      if (words[w].length < 3) continue; // skip short words
      wordCounts[words[w]] = (wordCounts[words[w]] || 0) + 1;
      if (wordCounts[words[w]] >= 3) hasRepeat = true;
    }
    if (hasRepeat) {
      repeatCount++;
      if (repeatEx.length < MAX_EXAMPLES) {
        var repeated = [];
        for (var rw in wordCounts) { if (wordCounts[rw] >= 3) repeated.push(rw + ' x' + wordCounts[rw]); }
        repeatEx.push(exampleObj(i, rows, colMap, repeated.join(', '), colMap.title));
      }
    }

    // ALL CAPS or all lowercase titles (suspicious casing)
    if (v.length > 10 && (v === v.toUpperCase() || v === v.toLowerCase())) {
      casingCount++;
      if (casingEx.length < MAX_EXAMPLES) casingEx.push(exampleObj(i, rows, colMap, v.substring(0, 50), colMap.title));
    }

    // Special unicode characters used for attention (stars, arrows, hearts, etc.)
    if (attentionCharsRegex.test(v)) {
      specialCharCount++;
      if (specialCharEx.length < MAX_EXAMPLES) {
        var found = v.match(attentionCharsRegex);
        specialCharEx.push(exampleObj(i, rows, colMap, 'Contains: ' + (found ? found[0] : 'special chars'), colMap.title));
      }
    }

    // Extra whitespace (Google spec: "Don't use extra white spaces")
    if (/\s{2,}/.test(v)) {
      extraWsCount++;
      if (extraWsEx.length < MAX_EXAMPLES) extraWsEx.push(exampleObj(i, rows, colMap, v.substring(0, 50), colMap.title));
    }
  }

  results.push(makeResult('Title Quality', 'Title no HTML tags', 'High',
    htmlCount === 0 ? 'PASS' : 'FAIL',
    htmlCount === 0 ? 'No HTML tags in titles.' : htmlCount + ' title(s) contain HTML tags.',
    htmlCount, total, htmlEx));

  results.push(makeResult('Title Quality', 'No repeating words in titles', 'Medium',
    repeatCount === 0 ? 'PASS' : 'WARNING',
    repeatCount === 0 ? 'No excessive word repetition in titles.' : repeatCount + ' title(s) have words repeated 3+ times.',
    repeatCount, total, repeatEx));

  results.push(makeResult('Title Quality', 'Title casing', 'Low',
    casingCount === 0 ? 'PASS' : 'WARNING',
    casingCount === 0 ? 'Title casing looks normal.' : casingCount + ' title(s) are ALL CAPS or all lowercase.',
    casingCount, total, casingEx));

  results.push(makeResult('Title Quality', 'No special unicode characters', 'High',
    specialCharCount === 0 ? 'PASS' : 'WARNING',
    specialCharCount === 0 ? 'No attention-getting symbols (★, ♥, ➡, etc.) in titles.' : specialCharCount + ' title(s) contain special unicode symbols. Google may disapprove products with attention-getting characters.',
    specialCharCount, total, specialCharEx));

  results.push(makeResult('Title Quality', 'No extra whitespace in titles', 'Medium',
    extraWsCount === 0 ? 'PASS' : 'WARNING',
    extraWsCount === 0 ? 'No extra whitespace in titles.' : extraWsCount + ' title(s) contain consecutive whitespace. Google spec: "Don\'t use extra white spaces."',
    extraWsCount, total, extraWsEx));

  // Gender/age group mismatch in titles
  if (colMap.gender !== -1) {
    var genderMismatch = 0, genderMisEx = [];
    var genderKeywords = {
      'male': ['\\bmen\\b', '\\bmens\\b', "\\bmen's\\b", '\\bboys\\b', "\\bboy's\\b", '\\bmale\\b'],
      'female': ['\\bwomen\\b', '\\bwomens\\b', "\\bwomen's\\b", '\\bgirls\\b', "\\bgirl's\\b", '\\bfemale\\b', '\\bladies\\b'],
      'unisex': ['\\bunisex\\b']
    };

    for (var i = 0; i < rows.length; i++) {
      var title = cellStr(rows[i], colMap.title).toLowerCase();
      var gender = cellStr(rows[i], colMap.gender).toLowerCase();
      if (title === '' || gender === '') continue;

      var titleGenders = [];
      for (var g in genderKeywords) {
        var patterns = genderKeywords[g];
        for (var p = 0; p < patterns.length; p++) {
          if (new RegExp(patterns[p], 'i').test(title)) { titleGenders.push(g); break; }
        }
      }

      if (titleGenders.length > 0 && titleGenders.indexOf(gender) === -1) {
        genderMismatch++;
        if (genderMisEx.length < MAX_EXAMPLES) genderMisEx.push(exampleObj(i, rows, colMap, 'gender=' + gender + ' but title suggests ' + titleGenders.join('/'), colMap.title));
      }
    }

    results.push(makeResult('Title Quality', 'Gender mismatch in titles', 'Medium',
      genderMismatch === 0 ? 'PASS' : 'WARNING',
      genderMismatch === 0 ? 'No gender mismatches between title text and gender field.' : genderMismatch + ' product(s) have gender mismatch between title and gender attribute.',
      genderMismatch, total, genderMisEx));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check: Description Quality (advanced)
// ---------------------------------------------------------------------------

function checkDescriptionQuality(rows, colMap, total) {
  var results = [];
  if (colMap.description === -1) return results;

  var titleStuffCount = 0, titleStuffEx = [];
  var promoLinkCount = 0, promoLinkEx = [];
  var linkInDescCount = 0, linkInDescEx = [];
  var descCapsCount = 0, descCapsEx = [];
  var descUnicodeCount = 0, descUnicodeEx = [];
  var linkInDescRegex = /https?:\/\/[^\s]+/i;
  var promoTextRegex = /\b(click here|buy now|order now|shop now|limited time|act now|subscribe|sign up)\b/i;
  // Match BMP special chars + emoji via surrogate pair alternation (see note in checkTitleQuality).
  var attentionCharsRegex = /[\u2605\u2606\u2764\u2665\u2666\u2660\u2663\u2702\u2714\u2716\u2728\u2733\u2734\u2747\u2756\u2B50\u2B55\u27A1\uFE0F\u25CF\u25CB\u25A0\u25A1\u25B2\u25BC\u2190-\u21FF\u2794-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]/;

  for (var i = 0; i < rows.length; i++) {
    var desc = cellStr(rows[i], colMap.description);
    if (desc === '') continue;
    var title = colMap.title >= 0 ? cellStr(rows[i], colMap.title) : '';

    // Description is essentially just the title (near-duplicate)
    if (title !== '') {
      var descClean = desc.replace(/<[^>]+>/g, '').trim();
      var titleClean = title.replace(/<[^>]+>/g, '').trim();
      if (titleClean.length > 10 && descClean.length > 0) {
        var similarity = descClean.toLowerCase() === titleClean.toLowerCase()
          || (descClean.length < titleClean.length * 1.2 && descClean.toLowerCase().indexOf(titleClean.toLowerCase()) !== -1);
        if (similarity) {
          titleStuffCount++;
          if (titleStuffEx.length < MAX_EXAMPLES) titleStuffEx.push(exampleObj(i, rows, colMap, 'Description is near-duplicate of title', colMap.description));
        }
      }
    }

    // Any links in description (Google spec: don't include URLs in description)
    if (linkInDescRegex.test(desc)) {
      linkInDescCount++;
      if (linkInDescEx.length < MAX_EXAMPLES) {
        var linkMatch = desc.match(linkInDescRegex);
        linkInDescEx.push(exampleObj(i, rows, colMap, linkMatch ? linkMatch[0].substring(0, 50) : 'URL in description', colMap.description));
      }
    }

    // Promotional calls-to-action in description
    if (promoTextRegex.test(desc)) {
      promoLinkCount++;
      if (promoLinkEx.length < MAX_EXAMPLES) {
        var promoMatch = desc.match(promoTextRegex);
        promoLinkEx.push(exampleObj(i, rows, colMap, promoMatch ? promoMatch[0] : 'promo content', colMap.description));
      }
    }

    // ALL CAPS description (Google spec: "Don't use capital letters for emphasis")
    var descText = desc.replace(/<[^>]+>/g, '').trim();
    if (descText.length > 30 && descText === descText.toUpperCase()) {
      descCapsCount++;
      if (descCapsEx.length < MAX_EXAMPLES) descCapsEx.push(exampleObj(i, rows, colMap, descText.substring(0, 50), colMap.description));
    }

    // Gimmicky unicode in description (Google spec: "Don't use foreign characters for gimmicky purposes")
    if (attentionCharsRegex.test(desc)) {
      descUnicodeCount++;
      if (descUnicodeEx.length < MAX_EXAMPLES) {
        var ufound = desc.match(attentionCharsRegex);
        descUnicodeEx.push(exampleObj(i, rows, colMap, 'Contains: ' + (ufound ? ufound[0] : 'special chars'), colMap.description));
      }
    }
  }

  if (colMap.title >= 0) {
    results.push(makeResult('Description Quality', 'Description is not just the title', 'Medium',
      titleStuffCount === 0 ? 'PASS' : 'WARNING',
      titleStuffCount === 0 ? 'Descriptions are distinct from product titles.' : titleStuffCount + ' description(s) are near-duplicates of the product title. Descriptions should add meaningful detail beyond the title.',
      titleStuffCount, total, titleStuffEx));
  }

  results.push(makeResult('Description Quality', 'No URLs in description', 'High',
    linkInDescCount === 0 ? 'PASS' : 'WARNING',
    linkInDescCount === 0 ? 'No URLs found in descriptions.' : linkInDescCount + ' description(s) contain URLs. Google spec states descriptions should not include links.',
    linkInDescCount, total, linkInDescEx));

  results.push(makeResult('Description Quality', 'No promotional calls-to-action', 'High',
    promoLinkCount === 0 ? 'PASS' : 'WARNING',
    promoLinkCount === 0 ? 'No promotional calls-to-action found in descriptions.' : promoLinkCount + ' description(s) contain promotional text (e.g., "buy now", "click here").',
    promoLinkCount, total, promoLinkEx));

  results.push(makeResult('Description Quality', 'Description not ALL CAPS', 'Medium',
    descCapsCount === 0 ? 'PASS' : 'WARNING',
    descCapsCount === 0 ? 'No descriptions are entirely uppercase.' : descCapsCount + ' description(s) are entirely uppercase. Google spec: "Don\'t use capital letters for emphasis."',
    descCapsCount, total, descCapsEx));

  results.push(makeResult('Description Quality', 'No gimmicky unicode in description', 'High',
    descUnicodeCount === 0 ? 'PASS' : 'WARNING',
    descUnicodeCount === 0 ? 'No attention-getting unicode symbols in descriptions.' : descUnicodeCount + ' description(s) contain attention-getting unicode symbols. Google may disapprove.',
    descUnicodeCount, total, descUnicodeEx));

  return results;
}

// ---------------------------------------------------------------------------
// Check: Additional Images
// ---------------------------------------------------------------------------

function checkAdditionalImages(rows, colMap, total) {
  var results = [];
  if (colMap.additional_image_link === -1) {
    results.push(makeResult('Image Quality', 'Additional images present', 'Low', 'SKIP', 'Additional image link column not found.', 0, total, []));
    return results;
  }

  var noAdditional = 0, noAddEx = [];
  var dupeImgCount = 0, dupeImgEx = [];
  var invalidCount = 0, invalidEx = [];
  var tooManyImgCount = 0, tooManyImgEx = [];

  for (var i = 0; i < rows.length; i++) {
    var addImg = cellStr(rows[i], colMap.additional_image_link);
    var mainImg = colMap.image_link >= 0 ? cellStr(rows[i], colMap.image_link) : '';

    if (addImg === '') {
      noAdditional++;
      if (noAddEx.length < MAX_EXAMPLES) noAddEx.push(exampleObj(i, rows, colMap, '(no additional images)', colMap.additional_image_link));
      continue;
    }

    // Check for duplicate with primary image and count
    var addImages = addImg.split(/[,|]/);
    var validImgCount = addImages.filter(function(s) { return s.trim() !== ''; }).length;
    if (validImgCount > 10) {
      tooManyImgCount++;
      if (tooManyImgEx.length < MAX_EXAMPLES) tooManyImgEx.push(exampleObj(i, rows, colMap, validImgCount + ' images', colMap.additional_image_link));
    }
    for (var ai = 0; ai < addImages.length; ai++) {
      var img = addImages[ai].trim();
      if (img === '') continue;
      if (mainImg !== '' && img.toLowerCase() === mainImg.toLowerCase()) {
        dupeImgCount++;
        if (dupeImgEx.length < MAX_EXAMPLES) dupeImgEx.push(exampleObj(i, rows, colMap, 'Same as primary image', colMap.additional_image_link));
        break;
      }
      // Check for commas/invalid chars in URL
      if (/[,\s<>]/.test(img) || !/^https?:\/\//i.test(img)) {
        invalidCount++;
        if (invalidEx.length < MAX_EXAMPLES) invalidEx.push(exampleObj(i, rows, colMap, img.substring(0, 60), colMap.additional_image_link));
      }
    }
  }

  var noAddPct = total > 0 ? (noAdditional / total * 100) : 0;
  results.push(makeResult('Image Quality', 'Additional images present', 'Low',
    noAddPct <= 50 ? 'PASS' : 'WARNING',
    noAdditional === 0 ? 'All products have additional images.' : noAdditional + ' product(s) (' + noAddPct.toFixed(1) + '%) have no additional images. Multiple images improve conversion.',
    noAdditional, total, noAddEx));

  results.push(makeResult('Image Quality', 'No duplicate primary/additional images', 'Medium',
    dupeImgCount === 0 ? 'PASS' : 'WARNING',
    dupeImgCount === 0 ? 'No additional images duplicate the primary image.' : dupeImgCount + ' product(s) have an additional image that duplicates the primary image.',
    dupeImgCount, total, dupeImgEx));

  results.push(makeResult('Image Quality', 'Additional images max 10', 'Medium',
    tooManyImgCount === 0 ? 'PASS' : 'WARNING',
    tooManyImgCount === 0 ? 'All products have 10 or fewer additional images.' : tooManyImgCount + ' product(s) have more than 10 additional images. Google accepts a maximum of 10.',
    tooManyImgCount, total, tooManyImgEx));

  results.push(makeResult('Image Quality', 'Additional image link format', 'High',
    invalidCount === 0 ? 'PASS' : 'FAIL',
    invalidCount === 0 ? 'All additional image links have valid format.' : invalidCount + ' additional image link(s) have invalid URLs or formatting issues.',
    invalidCount, total, invalidEx));

  return results;
}

// ---------------------------------------------------------------------------
// Check: Link Quality
// ---------------------------------------------------------------------------

function checkLinkQuality(rows, colMap, total) {
  var results = [];
  if (colMap.link === -1) return results;

  var invalidCharCount = 0, invalidCharEx = [];
  var noProtocolCount = 0, noProtoEx = [];
  var tooLongCount = 0, tooLongEx = [];
  var nonAsciiUrlCount = 0, nonAsciiUrlEx = [];
  var utmCount = 0;
  var nonBlankLinks = 0;
  // eslint-disable-next-line no-control-regex
  var nonAsciiRegex = /[^\x20-\x7E]/;

  for (var i = 0; i < rows.length; i++) {
    var v = cellStr(rows[i], colMap.link);
    if (v === '') continue;
    nonBlankLinks++;

    // Must start with http:// or https://
    if (!/^https?:\/\//i.test(v)) {
      noProtocolCount++;
      if (noProtoEx.length < MAX_EXAMPLES) noProtoEx.push(exampleObj(i, rows, colMap, v.substring(0, 60), colMap.link));
    }

    // Max 2,000 characters (Google hard limit)
    if (v.length > 2000) {
      tooLongCount++;
      if (tooLongEx.length < MAX_EXAMPLES) tooLongEx.push(exampleObj(i, rows, colMap, v.length + ' chars', colMap.link));
    }

    // ASCII characters only (Google spec: "ASCII characters only, and RFC 3986 compliant")
    if (nonAsciiRegex.test(v)) {
      nonAsciiUrlCount++;
      if (nonAsciiUrlEx.length < MAX_EXAMPLES) nonAsciiUrlEx.push(exampleObj(i, rows, colMap, v.substring(0, 60), colMap.link));
    }

    // Check for spaces, commas, or angle brackets in URL
    if (/[\s,<>]/.test(v)) {
      invalidCharCount++;
      if (invalidCharEx.length < MAX_EXAMPLES) invalidCharEx.push(exampleObj(i, rows, colMap, v.substring(0, 60), colMap.link));
    }

    if (/utm_/i.test(v)) utmCount++;
  }

  results.push(makeResult('Link Quality', 'Links use http/https protocol', 'High',
    noProtocolCount === 0 ? 'PASS' : 'FAIL',
    noProtocolCount === 0 ? 'All product links use http:// or https:// protocol.' : noProtocolCount + ' URL(s) do not start with http:// or https://. All product links must use a valid protocol.',
    noProtocolCount, total, noProtoEx));

  results.push(makeResult('Link Quality', 'Link max 2,000 characters', 'High',
    tooLongCount === 0 ? 'PASS' : 'FAIL',
    tooLongCount === 0 ? 'All product links are within 2,000 characters.' : tooLongCount + ' URL(s) exceed 2,000 characters. Google will reject these.',
    tooLongCount, total, tooLongEx));

  results.push(makeResult('Link Quality', 'Link ASCII characters only', 'High',
    nonAsciiUrlCount === 0 ? 'PASS' : 'FAIL',
    nonAsciiUrlCount === 0 ? 'All product links use ASCII characters only.' : nonAsciiUrlCount + ' URL(s) contain non-ASCII characters. Google requires ASCII only, RFC 3986 compliant URLs. URL-encode non-ASCII characters.',
    nonAsciiUrlCount, total, nonAsciiUrlEx));

  results.push(makeResult('Link Quality', 'No invalid characters in URLs', 'High',
    invalidCharCount === 0 ? 'PASS' : 'FAIL',
    invalidCharCount === 0 ? 'All product URLs are clean.' : invalidCharCount + ' URL(s) contain spaces, commas, or invalid characters.',
    invalidCharCount, total, invalidCharEx));

  results.push(makeResult('Link Quality', 'UTM tracking parameters', 'Low',
    utmCount > 0 ? 'PASS' : 'WARNING',
    utmCount > 0
      ? utmCount + ' of ' + nonBlankLinks + ' URLs have UTM parameters for attribution tracking.'
      : 'No UTM parameters found in product URLs. Consider adding UTM parameters for campaign attribution.',
    utmCount > 0 ? 0 : nonBlankLinks, total, []));

  return results;
}

// ---------------------------------------------------------------------------
// Check: Attributes (Color, Material, Pattern, Size)
// ---------------------------------------------------------------------------

function checkAttributes(rows, colMap, total) {
  var results = [];
  var htmlRegex = /<[^>]+>/;

  // Per-field limits from Google specs
  var attrFields = [
    { field: 'color', label: 'Color', maxChars: 100, maxPerValue: 40, maxValues: 3 },
    { field: 'material', label: 'Material', maxChars: 200, maxPerValue: 0, maxValues: 3 },
    { field: 'pattern', label: 'Pattern', maxChars: 100, maxPerValue: 0, maxValues: 1 },
    { field: 'size', label: 'Size', maxChars: 100, maxPerValue: 0, maxValues: 0 }
  ];

  for (var a = 0; a < attrFields.length; a++) {
    var attr = attrFields[a];
    var colIdx = colMap[attr.field];
    if (colIdx === -1) continue;

    var casingIssues = 0, casingEx = [];
    var htmlIssues = 0, htmlEx = [];
    var tooLong = 0, tooLongEx = [];
    var commaIssues = 0, commaEx = [];
    var naValues = 0, naEx = [];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colIdx);
      if (v === '') continue;

      // HTML tags
      if (htmlRegex.test(v)) {
        htmlIssues++;
        if (htmlEx.length < MAX_EXAMPLES) htmlEx.push(exampleObj(i, rows, colMap, v.match(htmlRegex)[0], colIdx));
      }

      // ALL CAPS
      if (v.length > 3 && v === v.toUpperCase()) {
        casingIssues++;
        if (casingEx.length < MAX_EXAMPLES) casingEx.push(exampleObj(i, rows, colMap, v, colIdx));
      }

      // Max characters
      if (attr.maxChars > 0 && v.length > attr.maxChars) {
        tooLong++;
        if (tooLongEx.length < MAX_EXAMPLES) tooLongEx.push(exampleObj(i, rows, colMap, v.length + ' chars', colIdx));
      }

      // Commas used as separator (Google says use slash / for multi-values; pattern = single value only)
      if (/,/.test(v) && (attr.field === 'color' || attr.field === 'size' || attr.field === 'material' || attr.field === 'pattern')) {
        commaIssues++;
        if (commaEx.length < MAX_EXAMPLES) commaEx.push(exampleObj(i, rows, colMap, v.substring(0, 50), colIdx));
      }

      // N/A, none, variety, etc.
      var lower = v.toLowerCase().trim();
      if (/^(n\/a|na|none|variety|multi|other|see image|multisize|n\.a\.)$/i.test(lower)) {
        naValues++;
        if (naEx.length < MAX_EXAMPLES) naEx.push(exampleObj(i, rows, colMap, v, colIdx));
      }
    }

    results.push(makeResult('Attributes', attr.label + ' no HTML', 'High',
      htmlIssues === 0 ? 'PASS' : 'FAIL',
      htmlIssues === 0 ? 'No HTML tags in ' + attr.label.toLowerCase() + ' values.' : htmlIssues + ' ' + attr.label.toLowerCase() + ' value(s) contain HTML tags.',
      htmlIssues, total, htmlEx));

    results.push(makeResult('Attributes', attr.label + ' casing', 'Low',
      casingIssues === 0 ? 'PASS' : 'WARNING',
      casingIssues === 0 ? 'No ALL CAPS ' + attr.label.toLowerCase() + ' values.' : casingIssues + ' ' + attr.label.toLowerCase() + ' value(s) are ALL CAPS.',
      casingIssues, total, casingEx));

    results.push(makeResult('Attributes', attr.label + ' max ' + attr.maxChars + ' characters', 'High',
      tooLong === 0 ? 'PASS' : 'FAIL',
      tooLong === 0 ? 'All ' + attr.label.toLowerCase() + ' values are within ' + attr.maxChars + ' characters.' : tooLong + ' ' + attr.label.toLowerCase() + ' value(s) exceed ' + attr.maxChars + ' characters.',
      tooLong, total, tooLongEx));

    results.push(makeResult('Attributes', attr.label + ' use slash not comma', 'High',
      commaIssues === 0 ? 'PASS' : 'WARNING',
      commaIssues === 0 ? 'No commas found in ' + attr.label.toLowerCase() + ' values.' : commaIssues + ' ' + attr.label.toLowerCase() + ' value(s) use commas. Google requires slash (/) to separate multiple values (e.g., "Red/Blue" not "Red, Blue").',
      commaIssues, total, commaEx));

    results.push(makeResult('Attributes', attr.label + ' no placeholder values', 'Medium',
      naValues === 0 ? 'PASS' : 'FAIL',
      naValues === 0 ? 'No placeholder values in ' + attr.label.toLowerCase() + '.' : naValues + ' ' + attr.label.toLowerCase() + ' value(s) are "N/A", "none", "variety", etc. Don\'t submit placeholder values — omit the field instead.',
      naValues, total, naEx));
  }

  // --- Color-specific checks ---
  if (colMap.color !== -1) {
    var colorHexCount = 0, colorHexEx = [];
    var colorNumCount = 0, colorNumEx = [];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.color);
      if (v === '') continue;

      // Hex codes (#fff000, #000, etc.)
      if (/^#[0-9a-fA-F]{3,8}$/.test(v.trim())) {
        colorHexCount++;
        if (colorHexEx.length < MAX_EXAMPLES) colorHexEx.push(exampleObj(i, rows, colMap, v, colMap.color));
      }

      // Numbers only as color (e.g., "0 2 4 6 8")
      if (/^\d[\d\s]+$/.test(v.trim())) {
        colorNumCount++;
        if (colorNumEx.length < MAX_EXAMPLES) colorNumEx.push(exampleObj(i, rows, colMap, v, colMap.color));
      }
    }

    results.push(makeResult('Attributes', 'Color no hex codes', 'High',
      colorHexCount === 0 ? 'PASS' : 'FAIL',
      colorHexCount === 0 ? 'No hex codes found in color values.' : colorHexCount + ' color value(s) are hex codes (e.g., "#fff000"). Submit color names, not codes.',
      colorHexCount, total, colorHexEx));

    results.push(makeResult('Attributes', 'Color no numeric-only values', 'High',
      colorNumCount === 0 ? 'PASS' : 'FAIL',
      colorNumCount === 0 ? 'No numeric-only color values found.' : colorNumCount + ' color value(s) are numbers only (e.g., "0 2 4 6 8"). Submit color names.',
      colorNumCount, total, colorNumEx));

    // Color required for apparel (GPC 166)
    if (colMap.google_product_category !== -1) {
      var colorMissApparel = 0, colorMisAppEx = [];
      for (var i = 0; i < rows.length; i++) {
        var gpc = cellStr(rows[i], colMap.google_product_category).toLowerCase();
        var colorVal = cellStr(rows[i], colMap.color);
        if ((gpc === '166' || /\bapparel\b/i.test(gpc) || /\bclothing\b/i.test(gpc)) && colorVal === '') {
          colorMissApparel++;
          if (colorMisAppEx.length < MAX_EXAMPLES) colorMisAppEx.push(exampleObj(i, rows, colMap, 'Apparel, no color', colMap.google_product_category));
        }
      }
      results.push(makeResult('Attributes', 'Color set for apparel', 'High',
        colorMissApparel === 0 ? 'PASS' : 'WARNING',
        colorMissApparel === 0 ? 'All apparel products have color set.' : colorMissApparel + ' apparel product(s) are missing color. Google requires color for Apparel & Accessories (GPC 166).',
        colorMissApparel, total, colorMisAppEx));
    }
  }

  // Gender required for apparel (GPC 166)
  if (colMap.gender !== -1 && colMap.google_product_category !== -1) {
    var genderMissApparel = 0, genderMisAppEx = [];
    for (var i = 0; i < rows.length; i++) {
      var gpc = cellStr(rows[i], colMap.google_product_category).toLowerCase();
      var genderVal = cellStr(rows[i], colMap.gender);
      if ((gpc === '166' || /\bapparel\b/i.test(gpc) || /\bclothing\b/i.test(gpc)) && genderVal === '') {
        genderMissApparel++;
        if (genderMisAppEx.length < MAX_EXAMPLES) genderMisAppEx.push(exampleObj(i, rows, colMap, 'Apparel, no gender', colMap.google_product_category));
      }
    }
    results.push(makeResult('Attributes', 'Gender set for apparel', 'High',
      genderMissApparel === 0 ? 'PASS' : 'WARNING',
      genderMissApparel === 0 ? 'All apparel products have gender set.' : genderMissApparel + ' apparel product(s) are missing gender. Google requires gender for Apparel & Accessories (GPC 166).',
      genderMissApparel, total, genderMisAppEx));
  }

  // Size required for Clothing (GPC 1604) and Shoes (GPC 187)
  if (colMap.size !== -1 && colMap.google_product_category !== -1) {
    var sizeMissClothing = 0, sizeMisClothEx = [];
    for (var i = 0; i < rows.length; i++) {
      var gpc = cellStr(rows[i], colMap.google_product_category).toLowerCase();
      var sizeVal = cellStr(rows[i], colMap.size);
      if (sizeVal !== '') continue;
      // Check for Clothing (1604) or Shoes (187) by ID or text
      if (gpc === '1604' || gpc === '187' || /\bclothing\b/i.test(gpc) || /\bshoes\b/i.test(gpc) || /\bfootwear\b/i.test(gpc)) {
        sizeMissClothing++;
        if (sizeMisClothEx.length < MAX_EXAMPLES) sizeMisClothEx.push(exampleObj(i, rows, colMap, 'GPC: ' + gpc.substring(0, 30) + ', no size', colMap.google_product_category));
      }
    }
    results.push(makeResult('Attributes', 'Size set for clothing/shoes', 'High',
      sizeMissClothing === 0 ? 'PASS' : 'WARNING',
      sizeMissClothing === 0 ? 'All clothing/shoes products have size set.' : sizeMissClothing + ' clothing/shoes product(s) are missing size. Google requires size for Clothing (GPC 1604) and Shoes (GPC 187).',
      sizeMissClothing, total, sizeMisClothEx));
  }

  // Size type valid values
  if (colMap.size_type !== -1) {
    var stInvalid = 0, stEx = [];
    var validSizeTypes = ['regular', 'petite', 'plus', 'tall', 'big', 'maternity'];
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.size_type).toLowerCase().trim();
      if (v === '') continue;
      // Can have up to 2 comma-separated values
      var parts = v.split(/[,\/]/).map(function(s) { return s.trim(); });
      for (var p = 0; p < parts.length; p++) {
        if (parts[p] !== '' && validSizeTypes.indexOf(parts[p]) === -1) {
          stInvalid++;
          if (stEx.length < MAX_EXAMPLES) stEx.push(exampleObj(i, rows, colMap, parts[p], colMap.size_type));
          break;
        }
      }
    }
    results.push(makeResult('Attributes', 'Size type valid values', 'Medium',
      stInvalid === 0 ? 'PASS' : 'FAIL',
      stInvalid === 0 ? 'All size_type values are valid.' : stInvalid + ' size_type value(s) are invalid. Valid: regular, petite, plus, tall, big, maternity.',
      stInvalid, total, stEx));
  } else {
    results.push(makeResult('Attributes', 'Size type valid values', 'Medium', 'SKIP', 'Size type column not found.', 0, total, []));
  }

  // Size system valid values
  if (colMap.size_system !== -1) {
    var ssInvalid = 0, ssEx = [];
    var validSizeSystems = ['au', 'br', 'cn', 'de', 'eu', 'fr', 'it', 'jp', 'mex', 'uk', 'us'];
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.size_system).toLowerCase().trim();
      if (v === '') continue;
      if (validSizeSystems.indexOf(v) === -1) {
        ssInvalid++;
        if (ssEx.length < MAX_EXAMPLES) ssEx.push(exampleObj(i, rows, colMap, v, colMap.size_system));
      }
    }
    results.push(makeResult('Attributes', 'Size system valid values', 'Medium',
      ssInvalid === 0 ? 'PASS' : 'FAIL',
      ssInvalid === 0 ? 'All size_system values are valid.' : ssInvalid + ' size_system value(s) are invalid. Valid: AU, BR, CN, DE, EU, FR, IT, JP, MEX, UK, US.',
      ssInvalid, total, ssEx));
  } else {
    results.push(makeResult('Attributes', 'Size system valid values', 'Medium', 'SKIP', 'Size system column not found.', 0, total, []));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check: Gender & Age Group
// ---------------------------------------------------------------------------

function checkGenderAgeGroup(rows, colMap, total) {
  var results = [];

  // Gender valid values
  if (colMap.gender !== -1) {
    var genderInvalid = 0, genderEx = [];
    var validGenders = ['male', 'female', 'unisex'];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.gender).toLowerCase();
      if (v === '') continue;
      if (validGenders.indexOf(v) === -1) {
        genderInvalid++;
        if (genderEx.length < MAX_EXAMPLES) genderEx.push(exampleObj(i, rows, colMap, v, colMap.gender));
      }
    }

    results.push(makeResult('Attributes', 'Gender valid values', 'High',
      genderInvalid === 0 ? 'PASS' : 'FAIL',
      genderInvalid === 0 ? 'All gender values are valid (male, female, unisex).' : genderInvalid + ' product(s) have invalid gender values.',
      genderInvalid, total, genderEx));
  }

  // Age group valid values
  if (colMap.age_group !== -1) {
    var ageInvalid = 0, ageEx = [];
    var validAges = ['newborn', 'infant', 'toddler', 'kids', 'adult'];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.age_group).toLowerCase();
      if (v === '') continue;
      if (validAges.indexOf(v) === -1) {
        ageInvalid++;
        if (ageEx.length < MAX_EXAMPLES) ageEx.push(exampleObj(i, rows, colMap, v, colMap.age_group));
      }
    }

    results.push(makeResult('Attributes', 'Age group valid values', 'High',
      ageInvalid === 0 ? 'PASS' : 'FAIL',
      ageInvalid === 0 ? 'All age group values are valid (newborn, infant, toddler, kids, adult).' : ageInvalid + ' product(s) have invalid age group values.',
      ageInvalid, total, ageEx));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check: Shipping
// ---------------------------------------------------------------------------

function checkShipping(rows, colMap, total) {
  var results = [];

  // Shipping weight
  if (colMap.shipping_weight !== -1) {
    var weightBlanks = 0, weightBlankEx = [];
    var weightInvalid = 0, weightInvEx = [];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.shipping_weight);
      if (v === '') { weightBlanks++; if (weightBlankEx.length < MAX_EXAMPLES) weightBlankEx.push(exampleObj(i, rows, colMap, '(empty)', colMap.shipping_weight)); continue; }

      // Extract numeric part — weight can be "1.5 lb", "500 g", "2.3kg", or just "1.5"
      var numericPart = v.replace(/[^0-9.\-]/g, '');
      var num = parseFloat(numericPart);
      if (isNaN(num) || num <= 0) {
        weightInvalid++;
        if (weightInvEx.length < MAX_EXAMPLES) weightInvEx.push(exampleObj(i, rows, colMap, v, colMap.shipping_weight));
      }
    }

    var weightBlankPct = total > 0 ? (weightBlanks / total * 100) : 0;
    results.push(makeResult('Shipping', 'Shipping weight present', 'Medium',
      weightBlanks === 0 ? 'PASS' : (weightBlankPct > 50 ? 'WARNING' : 'PASS'),
      weightBlanks === 0 ? 'All products have shipping weight.' : weightBlanks + ' product(s) (' + weightBlankPct.toFixed(1) + '%) missing shipping weight.',
      weightBlanks, total, weightBlankEx));

    results.push(makeResult('Shipping', 'Shipping weight valid format', 'Medium',
      weightInvalid === 0 ? 'PASS' : 'FAIL',
      weightInvalid === 0 ? 'All shipping weight values are valid.' : weightInvalid + ' product(s) have invalid shipping weight values (non-numeric or <= 0).',
      weightInvalid, total, weightInvEx));
  }

  // Shipping price
  if (colMap.shipping_price !== -1) {
    var shipBlanks = 0;
    for (var i = 0; i < rows.length; i++) {
      if (cellStr(rows[i], colMap.shipping_price) === '') shipBlanks++;
    }

    var shipBlankPct = total > 0 ? (shipBlanks / total * 100) : 0;
    results.push(makeResult('Shipping', 'Shipping info present', 'Low',
      shipBlanks === 0 ? 'PASS' : (shipBlankPct > 50 ? 'WARNING' : 'PASS'),
      shipBlanks === 0 ? 'All products have shipping information.' : shipBlanks + ' product(s) (' + shipBlankPct.toFixed(1) + '%) missing shipping info. Consider setting up shipping in Merchant Center if not in feed.',
      shipBlanks, total, []));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check: Sale Price Effective Date
// ---------------------------------------------------------------------------

function checkSalePriceDate(rows, colMap, total) {
  var results = [];
  if (colMap.sale_price_effective_date === -1) return results;

  var formatErrors = 0, formatEx = [];
  // Expected format: ISO 8601 date/time range, e.g. "2024-01-01T00:00:00-05:00/2024-01-31T23:59:59-05:00"
  var isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:?\d{2}|Z)?)?$/;
  var dateRangeRegex = /^\d{4}-\d{2}-\d{2}(T[^\s\/]+)?\s*\/\s*\d{4}-\d{2}-\d{2}(T[^\s\/]+)?$/;

  for (var i = 0; i < rows.length; i++) {
    var v = cellStr(rows[i], colMap.sale_price_effective_date);
    if (v === '') continue;

    // Should be a date range (start/end) or at least a valid ISO date
    if (!dateRangeRegex.test(v) && !isoDateRegex.test(v)) {
      formatErrors++;
      if (formatEx.length < MAX_EXAMPLES) formatEx.push(exampleObj(i, rows, colMap, v.substring(0, 60), colMap.sale_price_effective_date));
    }
  }

  results.push(makeResult('Pricing', 'Sale price effective date format', 'High',
    formatErrors === 0 ? 'PASS' : 'FAIL',
    formatErrors === 0 ? 'All sale price effective dates use correct format.' : formatErrors + ' product(s) have incorrectly formatted sale price effective dates. Expected: YYYY-MM-DDTHH:MM:SS+TZ/YYYY-MM-DDTHH:MM:SS+TZ.',
    formatErrors, total, formatEx));

  return results;
}

// ---------------------------------------------------------------------------
// Check: Item Group ID
// ---------------------------------------------------------------------------

function checkItemGroupId(rows, colMap, total) {
  var results = [];
  if (colMap.item_group_id === -1) return results;

  var blanks = 0, blankEx = [];
  var formatIssues = 0, formatEx = [];

  for (var i = 0; i < rows.length; i++) {
    var v = cellStr(rows[i], colMap.item_group_id);
    if (v === '') {
      blanks++;
      if (blankEx.length < MAX_EXAMPLES) blankEx.push(exampleObj(i, rows, colMap, '(empty)', colMap.item_group_id));
      continue;
    }

    // Check for obviously wrong formats (HTML, very long values, special chars)
    if (/<[^>]+>/.test(v) || v.length > 50) {
      formatIssues++;
      if (formatEx.length < MAX_EXAMPLES) formatEx.push(exampleObj(i, rows, colMap, v.substring(0, 50), colMap.item_group_id));
    }
  }

  var blankPct = total > 0 ? (blanks / total * 100) : 0;
  results.push(makeResult('Identifiers', 'Item group ID present', 'Medium',
    blanks === 0 ? 'PASS' : (blankPct > 50 ? 'WARNING' : 'PASS'),
    blanks === 0 ? 'All products have item_group_id for variant grouping.' : blanks + ' product(s) (' + blankPct.toFixed(1) + '%) missing item_group_id. Required for variant products.',
    blanks, total, blankEx));

  results.push(makeResult('Identifiers', 'Item group ID format', 'Medium',
    formatIssues === 0 ? 'PASS' : 'FAIL',
    formatIssues === 0 ? 'All item_group_id values have valid format.' : formatIssues + ' item_group_id value(s) have formatting issues (HTML or excessively long).',
    formatIssues, total, formatEx));

  // Item group ID: variants should have at least one variant attribute
  if (colMap.item_group_id !== -1) {
    var noVariantAttr = 0, noVarEx = [];
    for (var i = 0; i < rows.length; i++) {
      var igid = cellStr(rows[i], colMap.item_group_id);
      if (igid === '') continue;
      // Check if at least one variant attribute is populated
      var hasColor = colMap.color >= 0 && cellStr(rows[i], colMap.color) !== '';
      var hasSize = colMap.size >= 0 && cellStr(rows[i], colMap.size) !== '';
      var hasMaterial = colMap.material >= 0 && cellStr(rows[i], colMap.material) !== '';
      var hasPattern = colMap.pattern >= 0 && cellStr(rows[i], colMap.pattern) !== '';
      var hasGender = colMap.gender >= 0 && cellStr(rows[i], colMap.gender) !== '';
      var hasAgeGroup = colMap.age_group >= 0 && cellStr(rows[i], colMap.age_group) !== '';
      if (!hasColor && !hasSize && !hasMaterial && !hasPattern && !hasGender && !hasAgeGroup) {
        noVariantAttr++;
        if (noVarEx.length < MAX_EXAMPLES) noVarEx.push(exampleObj(i, rows, colMap, 'item_group_id=' + igid + ', no variant attrs', colMap.item_group_id));
      }
    }
    results.push(makeResult('Identifiers', 'Variants have variant attributes', 'Medium',
      noVariantAttr === 0 ? 'PASS' : 'WARNING',
      noVariantAttr === 0 ? 'All products with item_group_id have at least one variant attribute.' : noVariantAttr + ' product(s) have item_group_id but no variant attributes (color, size, material, pattern, gender, age_group). Google requires at least one variant attribute when using item_group_id.',
      noVariantAttr, total, noVarEx));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check: Google Merchant Specific
// ---------------------------------------------------------------------------

function checkGoogleMerchant(rows, colMap, total, platform) {
  var results = [];
  var prefix = platform === 'generic' ? 'Google Merchant' : 'Google Merchant';

  // GTIN / UPC / EAN / ISBN
  if (colMap.gtin === -1) {
    results.push(makeResult(prefix, 'GTIN present', 'High', 'SKIP', 'GTIN/UPC/EAN/ISBN column not found.', 0, total, []))
    results.push(makeResult(prefix, 'GTIN valid format', 'High', 'SKIP', 'GTIN/UPC/EAN/ISBN column not found.', 0, total, []))
    results.push(makeResult(prefix, 'GTIN check digit valid', 'High', 'SKIP', 'GTIN/UPC/EAN/ISBN column not found.', 0, total, []))
  } else {
    var gtinBlanks = 0;
    var gtinInvalid = 0, gtinInvEx = [];
    var checkDigitFails = 0, checkDigitEx = [];
    var gtinPlaceholders = 0, gtinPlaceholderEx = [];
    // Common placeholder/test GTINs
    var placeholderPatterns = [/^0+$/, /^1234/, /^9999/, /^00000/, /^does\s*not\s*apply/i, /^na$/i, /^n\/a$/i, /^none$/i, /^null$/i, /^test/i];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.gtin);
      if (v === '') { gtinBlanks++; continue; }

      // Check for placeholder/test values
      var isPlaceholder = false;
      for (var pp = 0; pp < placeholderPatterns.length; pp++) {
        if (placeholderPatterns[pp].test(v.trim())) { isPlaceholder = true; break; }
      }
      if (isPlaceholder) {
        gtinPlaceholders++;
        if (gtinPlaceholderEx.length < MAX_EXAMPLES) gtinPlaceholderEx.push(exampleObj(i, rows, colMap, v, colMap.gtin));
        continue;
      }

      var cleaned = v.replace(/[\s\-]/g, ''); // strip spaces and hyphens
      var digits = cleaned.replace(/[^0-9Xx]/g, '');

      // ISBN-10 check (10 chars, last can be X)
      if (digits.length === 10 && /^[0-9]{9}[0-9Xx]$/.test(digits)) {
        if (!validateISBN10CheckDigit(digits)) {
          checkDigitFails++;
          if (checkDigitEx.length < MAX_EXAMPLES) checkDigitEx.push(exampleObj(i, rows, colMap, v + ' (invalid ISBN-10 check digit)', colMap.gtin));
        }
        continue; // valid length for ISBN-10, skip GTIN format check
      }

      var numericDigits = digits.replace(/[^0-9]/g, '');

      // GTIN digit count check
      if (numericDigits.length !== 8 && numericDigits.length !== 12 && numericDigits.length !== 13 && numericDigits.length !== 14) {
        gtinInvalid++;
        if (gtinInvEx.length < MAX_EXAMPLES) gtinInvEx.push(exampleObj(i, rows, colMap, v + ' (' + numericDigits.length + ' digits)', colMap.gtin));
        continue;
      }

      // GS1 check digit validation (works for GTIN-8, UPC-12, EAN-13, GTIN-14, ISBN-13)
      if (!validateGTINCheckDigit(numericDigits)) {
        checkDigitFails++;
        if (checkDigitEx.length < MAX_EXAMPLES) checkDigitEx.push(exampleObj(i, rows, colMap, v + ' (invalid check digit)', colMap.gtin));
      }
    }

    var gtinPctMissing = total > 0 ? (gtinBlanks / total * 100) : 0;
    results.push(makeResult(prefix, 'GTIN present', 'High',
      gtinBlanks === 0 ? 'PASS' : (gtinPctMissing > 30 ? 'WARNING' : 'PASS'),
      gtinBlanks === 0 ? 'All products have GTIN.' : gtinBlanks + ' product(s) missing GTIN (' + gtinPctMissing.toFixed(1) + '%). Not all products require GTIN, but coverage improves performance.',
      gtinBlanks, total, []))

    results.push(makeResult(prefix, 'GTIN valid format (8/10/12/13/14 digits)', 'High',
      gtinInvalid === 0 ? 'PASS' : 'FAIL',
      gtinInvalid === 0 ? 'All GTINs have valid digit count.' : gtinInvalid + ' GTIN(s) have invalid format (must be 8, 10, 12, 13, or 14 digits).',
      gtinInvalid, total, gtinInvEx))

    results.push(makeResult(prefix, 'GTIN check digit valid', 'High',
      checkDigitFails === 0 ? 'PASS' : 'FAIL',
      checkDigitFails === 0 ? 'All GTINs pass check digit validation.' : checkDigitFails + ' GTIN(s) have invalid check digits. These will be rejected by Google Merchant Center.',
      checkDigitFails, total, checkDigitEx))

    results.push(makeResult(prefix, 'GTIN no placeholder values', 'High',
      gtinPlaceholders === 0 ? 'PASS' : 'FAIL',
      gtinPlaceholders === 0 ? 'No placeholder GTIN values detected.' : gtinPlaceholders + ' GTIN(s) appear to be placeholder/test values (all zeros, "1234...", "N/A", etc.). Remove or replace with real GTINs.',
      gtinPlaceholders, total, gtinPlaceholderEx))
  }

  // Brand
  if (colMap.brand === -1) {
    results.push(makeResult(prefix, 'Brand present', 'High', 'SKIP', 'Brand column not found.', 0, total, []))
  } else {
    var brandBlanks = 0;
    var brandTooLong = 0, brandLongEx = [];
    for (var i = 0; i < rows.length; i++) {
      var bv = cellStr(rows[i], colMap.brand);
      if (bv === '') { brandBlanks++; continue; }
      if (bv.length > 70) {
        brandTooLong++;
        if (brandLongEx.length < MAX_EXAMPLES) brandLongEx.push(exampleObj(i, rows, colMap, bv.length + ' chars: ' + bv.substring(0, 40) + '...', colMap.brand));
      }
    }

    results.push(makeResult(prefix, 'Brand present', 'High',
      brandBlanks === 0 ? 'PASS' : 'FAIL',
      brandBlanks === 0 ? 'All products have a brand.' : brandBlanks + ' product(s) missing brand.',
      brandBlanks, total, []))

    results.push(makeResult(prefix, 'Brand max 70 characters', 'High',
      brandTooLong === 0 ? 'PASS' : 'FAIL',
      brandTooLong === 0 ? 'All brand values are within 70 characters.' : brandTooLong + ' brand value(s) exceed 70 characters. Google will reject these.',
      brandTooLong, total, brandLongEx))
  }

  // MPN present when GTIN missing
  if (colMap.gtin !== -1 || colMap.mpn !== -1) {
    if (colMap.gtin === -1 && colMap.mpn === -1) {
      results.push(makeResult(prefix, 'MPN present when GTIN missing', 'High', 'SKIP', 'Neither GTIN nor MPN column found.', 0, total, []))
    } else {
      var bothMissing = 0;
      for (var i = 0; i < rows.length; i++) {
        var gtinVal = colMap.gtin >= 0 ? cellStr(rows[i], colMap.gtin) : '';
        var mpnVal = colMap.mpn >= 0 ? cellStr(rows[i], colMap.mpn) : '';
        if (gtinVal === '' && mpnVal === '') bothMissing++;
      }

      results.push(makeResult(prefix, 'MPN present when GTIN missing', 'High',
        bothMissing === 0 ? 'PASS' : 'FAIL',
        bothMissing === 0 ? 'All products have either GTIN or MPN.' : bothMissing + ' product(s) missing both GTIN and MPN.',
        bothMissing, total, []))
    }
  } else {
    results.push(makeResult(prefix, 'MPN present when GTIN missing', 'High', 'SKIP', 'Neither GTIN nor MPN column found.', 0, total, []))
  }

  // Google product category
  if (colMap.google_product_category === -1) {
    results.push(makeResult(prefix, 'Google product category mapped', 'High', 'SKIP', 'Google product category column not found.', 0, total, []))
    results.push(makeResult(prefix, 'GPC granularity', 'Medium', 'SKIP', 'Google product category column not found.', 0, total, []))
  } else {
    var catBlanks = 0, catBlankEx = [];
    var shallowGpc = 0, shallowEx = [];
    var gpcFormatIssues = 0, gpcFmtEx = [];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.google_product_category);
      if (v === '') { catBlanks++; if (catBlankEx.length < MAX_EXAMPLES) catBlankEx.push(exampleObj(i, rows, colMap, '(empty)', colMap.google_product_category)); continue; }

      // GPC can be numeric ID (e.g., "1234") or text path (e.g., "Apparel > Clothing > Shirts")
      var isNumeric = /^\d+$/.test(v.trim());

      if (!isNumeric) {
        // Text path — check granularity by counting separators
        var tiers = v.split(/\s*>\s*/).filter(function(s) { return s.trim() !== ''; });
        if (tiers.length < 3) {
          shallowGpc++;
          if (shallowEx.length < MAX_EXAMPLES) shallowEx.push(exampleObj(i, rows, colMap, tiers.length + ' tiers: ' + v.substring(0, 50), colMap.google_product_category));
        }

        // Check for formatting issues (HTML, commas instead of >, etc.)
        if (/<[^>]+>/.test(v) || (/,/.test(v) && !/\s*>\s*/.test(v))) {
          gpcFormatIssues++;
          if (gpcFmtEx.length < MAX_EXAMPLES) gpcFmtEx.push(exampleObj(i, rows, colMap, v.substring(0, 50), colMap.google_product_category));
        }
      }
      // Numeric IDs are valid — Google resolves them. We can't check depth without the taxonomy file.
    }

    results.push(makeResult(prefix, 'Google product category mapped', 'High',
      catBlanks === 0 ? 'PASS' : 'FAIL',
      catBlanks === 0 ? 'All products have Google product category.' : catBlanks + ' product(s) missing Google product category.',
      catBlanks, total, catBlankEx))

    if (!(/^\d+$/.test(cellStr(rows[0], colMap.google_product_category).trim()))) {
      // Only show granularity check for text-path GPCs
      results.push(makeResult(prefix, 'GPC granularity (>= 3 tiers)', 'Medium',
        shallowGpc === 0 ? 'PASS' : 'WARNING',
        shallowGpc === 0 ? 'All Google product categories are at least 3 tiers deep.' : shallowGpc + ' product(s) have shallow GPC (< 3 tiers). More granular categories improve ad targeting.',
        shallowGpc, total, shallowEx))
    }

    results.push(makeResult(prefix, 'GPC format clean', 'High',
      gpcFormatIssues === 0 ? 'PASS' : 'FAIL',
      gpcFormatIssues === 0 ? 'All GPC values have clean formatting.' : gpcFormatIssues + ' GPC value(s) have formatting issues (HTML, commas instead of > separator).',
      gpcFormatIssues, total, gpcFmtEx))
  }

  // Product type
  if (colMap.product_type === -1) {
    results.push(makeResult(prefix, 'Product type set', 'Medium', 'SKIP', 'Product type column not found.', 0, total, []))
  } else {
    var ptBlanks = 0, ptBlankEx = [];
    var ptShallow = 0, ptShallowEx = [];
    var ptFormatIssues = 0, ptFmtEx = [];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.product_type);
      if (v === '') { ptBlanks++; if (ptBlankEx.length < MAX_EXAMPLES) ptBlankEx.push(exampleObj(i, rows, colMap, '(empty)', colMap.product_type)); continue; }

      // Count tiers (separated by > or /)
      var tiers = v.split(/\s*[>\/]\s*/).filter(function(s) { return s.trim() !== ''; });
      if (tiers.length < 3) {
        ptShallow++;
        if (ptShallowEx.length < MAX_EXAMPLES) ptShallowEx.push(exampleObj(i, rows, colMap, tiers.length + ' tiers: ' + v.substring(0, 50), colMap.product_type));
      }

      // Formatting issues: HTML, excessive commas, inconsistent casing
      if (/<[^>]+>/.test(v)) {
        ptFormatIssues++;
        if (ptFmtEx.length < MAX_EXAMPLES) ptFmtEx.push(exampleObj(i, rows, colMap, v.substring(0, 50), colMap.product_type));
      }
    }

    results.push(makeResult(prefix, 'Product type set', 'Medium',
      ptBlanks === 0 ? 'PASS' : 'WARNING',
      ptBlanks === 0 ? 'All products have product type.' : ptBlanks + ' product(s) missing product type.',
      ptBlanks, total, ptBlankEx))

    results.push(makeResult(prefix, 'Product type >= 3 tiers', 'Medium',
      ptShallow === 0 ? 'PASS' : 'WARNING',
      ptShallow === 0 ? 'All product types have at least 3 tiers of depth.' : ptShallow + ' product type(s) have fewer than 3 tiers. Deeper categorization improves campaign performance.',
      ptShallow, total, ptShallowEx))

    results.push(makeResult(prefix, 'Product type format clean', 'Medium',
      ptFormatIssues === 0 ? 'PASS' : 'WARNING',
      ptFormatIssues === 0 ? 'All product type values have clean formatting.' : ptFormatIssues + ' product type(s) have formatting issues (HTML tags).',
      ptFormatIssues, total, ptFmtEx))
  }

  // Sale price < regular price (also checked globally, but repeated here for Google context)
  if (colMap.sale_price !== -1 && colMap.price !== -1) {
    var spErrors = 0;
    for (var i = 0; i < rows.length; i++) {
      var sp = parsePrice(cellStr(rows[i], colMap.sale_price));
      if (isNaN(sp) || sp <= 0) continue;
      var rp = parsePrice(cellStr(rows[i], colMap.price));
      if (!isNaN(rp) && sp >= rp) spErrors++;
    }

    results.push(makeResult(prefix, 'Sale price < regular price', 'Critical',
      spErrors === 0 ? 'PASS' : 'FAIL',
      spErrors === 0 ? 'All sale prices are below regular prices.' : spErrors + ' product(s) have sale price >= regular price. Google will disapprove these.',
      spErrors, total, []))
  }

  // Custom labels utilized
  var customLabelFields = ['custom_label_0', 'custom_label_1', 'custom_label_2', 'custom_label_3', 'custom_label_4'];
  var customLabelsFound = 0;
  var customLabelsPopulated = 0;
  for (var c = 0; c < customLabelFields.length; c++) {
    if (colMap[customLabelFields[c]] !== -1) {
      customLabelsFound++;
      for (var i = 0; i < rows.length; i++) {
        if (cellStr(rows[i], colMap[customLabelFields[c]]) !== '') {
          customLabelsPopulated++;
          break; // At least one populated row in this label column
        }
      }
    }
  }

  results.push(makeResult(prefix, 'Custom labels utilized', 'Low',
    customLabelsFound === 0 ? 'WARNING' : 'PASS',
    customLabelsFound === 0
      ? 'No custom label columns found. Custom labels help with campaign segmentation.'
      : customLabelsFound + ' custom label column(s) found, ' + customLabelsPopulated + ' have data.',
    0, total, []))

  // Custom label max 100 characters
  var clTooLong = 0, clTooLongEx = [];
  for (var c = 0; c < customLabelFields.length; c++) {
    if (colMap[customLabelFields[c]] === -1) continue;
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap[customLabelFields[c]]);
      if (v.length > 100) {
        clTooLong++;
        if (clTooLongEx.length < MAX_EXAMPLES) clTooLongEx.push(exampleObj(i, rows, colMap, customLabelFields[c] + ': ' + v.length + ' chars', colMap[customLabelFields[c]]));
      }
    }
  }
  results.push(makeResult(prefix, 'Custom label max 100 characters', 'Medium',
    clTooLong === 0 ? 'PASS' : 'FAIL',
    clTooLong === 0 ? 'All custom label values are within 100 characters.' : clTooLong + ' custom label value(s) exceed 100 characters.',
    clTooLong, total, clTooLongEx));

  // --- Cost of Goods Sold ---
  if (colMap.cost_of_goods_sold !== -1) {
    var cogsInvalid = 0, cogsEx = [];
    var cogsCommaDecimal = 0, cogsCommaEx = [];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.cost_of_goods_sold);
      if (v === '') continue;
      // Should be a number, optionally followed by ISO 4217 currency code
      var num = parseFloat(v.replace(/[^0-9.\-]/g, ''));
      if (isNaN(num) || num < 0) {
        cogsInvalid++;
        if (cogsEx.length < MAX_EXAMPLES) cogsEx.push(exampleObj(i, rows, colMap, v, colMap.cost_of_goods_sold));
      }
      // Check for comma as decimal separator (Google requires ".")
      if (/\d,\d{1,2}(\s|$)/.test(v) && !/\d\.\d/.test(v)) {
        cogsCommaDecimal++;
        if (cogsCommaEx.length < MAX_EXAMPLES) cogsCommaEx.push(exampleObj(i, rows, colMap, v, colMap.cost_of_goods_sold));
      }
    }

    results.push(makeResult(prefix, 'Cost of goods sold valid format', 'Medium',
      cogsInvalid === 0 ? 'PASS' : 'WARNING',
      cogsInvalid === 0 ? 'All cost of goods sold values are valid.' : cogsInvalid + ' COGS value(s) are not valid numbers. Expected: number + ISO 4217 currency (e.g., "10.01 USD").',
      cogsInvalid, total, cogsEx));

    results.push(makeResult(prefix, 'COGS uses period for decimal', 'Medium',
      cogsCommaDecimal === 0 ? 'PASS' : 'FAIL',
      cogsCommaDecimal === 0 ? 'All COGS values use period for decimal separator.' : cogsCommaDecimal + ' COGS value(s) use comma as decimal separator. Google requires "." (e.g., "10.01" not "10,01").',
      cogsCommaDecimal, total, cogsCommaEx));
  } else {
    results.push(makeResult(prefix, 'Cost of goods sold valid format', 'Medium', 'SKIP', 'Cost of goods sold column not found.', 0, total, []));
    results.push(makeResult(prefix, 'COGS uses period for decimal', 'Medium', 'SKIP', 'Cost of goods sold column not found.', 0, total, []));
  }

  // --- Expiration Date ---
  if (colMap.expiration_date !== -1) {
    var expFormatErrors = 0, expFmtEx = [];
    var expPastDates = 0, expPastEx = [];
    var isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:?\d{2}|Z)?)?$/;
    var now = new Date();

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.expiration_date);
      if (v === '') continue;

      if (!isoDateTimeRegex.test(v)) {
        expFormatErrors++;
        if (expFmtEx.length < MAX_EXAMPLES) expFmtEx.push(exampleObj(i, rows, colMap, v.substring(0, 40), colMap.expiration_date));
      } else {
        // Check if date is in the past
        var dateStr = v.substring(0, 10); // YYYY-MM-DD
        var parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime()) && parsed < now) {
          expPastDates++;
          if (expPastEx.length < MAX_EXAMPLES) expPastEx.push(exampleObj(i, rows, colMap, v, colMap.expiration_date));
        }
      }
    }

    results.push(makeResult(prefix, 'Expiration date valid format', 'High',
      expFormatErrors === 0 ? 'PASS' : 'FAIL',
      expFormatErrors === 0 ? 'All expiration dates use valid ISO 8601 format.' : expFormatErrors + ' expiration date(s) are not valid ISO 8601 format. Expected: YYYY-MM-DDThh:mm±hhmm.',
      expFormatErrors, total, expFmtEx));

    results.push(makeResult(prefix, 'Expiration date not in past', 'High',
      expPastDates === 0 ? 'PASS' : 'FAIL',
      expPastDates === 0 ? 'No expiration dates are in the past.' : expPastDates + ' product(s) have expiration dates in the past. These products will not show.',
      expPastDates, total, expPastEx));
  } else {
    results.push(makeResult(prefix, 'Expiration date valid format', 'High', 'SKIP', 'Expiration date column not found.', 0, total, []));
    results.push(makeResult(prefix, 'Expiration date not in past', 'High', 'SKIP', 'Expiration date column not found.', 0, total, []));
  }

  // --- Sale price decimal precision ---
  if (colMap.sale_price !== -1) {
    var spDecimalErrors = 0, spDecEx = [];
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.sale_price);
      if (v === '') continue;
      // Check for more than 2 decimal digits (Google will round silently)
      var decMatch = v.match(/\.(\d{3,})/);
      if (decMatch) {
        spDecimalErrors++;
        if (spDecEx.length < MAX_EXAMPLES) spDecEx.push(exampleObj(i, rows, colMap, v, colMap.sale_price));
      }
    }
    results.push(makeResult(prefix, 'Sale price max 2 decimal places', 'Medium',
      spDecimalErrors === 0 ? 'PASS' : 'WARNING',
      spDecimalErrors === 0 ? 'All sale prices have 2 or fewer decimal places.' : spDecimalErrors + ' sale price(s) have more than 2 decimal digits. Google will silently round these, which may cause landing page price mismatch.',
      spDecimalErrors, total, spDecEx));
  } else {
    results.push(makeResult(prefix, 'Sale price max 2 decimal places', 'Medium', 'SKIP', 'Sale price column not found.', 0, total, []));
  }

  // --- Sale price effective date: past date detection ---
  if (colMap.sale_price_effective_date !== -1) {
    var saleDatePast = 0, saleDatePastEx = [];
    var now2 = new Date();
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.sale_price_effective_date);
      if (v === '') continue;
      // Format: start/end — check if end date is in the past
      var parts = v.split('/');
      if (parts.length === 2) {
        var endStr = parts[1].trim().substring(0, 10);
        var endDate = new Date(endStr);
        if (!isNaN(endDate.getTime()) && endDate < now2) {
          saleDatePast++;
          if (saleDatePastEx.length < MAX_EXAMPLES) saleDatePastEx.push(exampleObj(i, rows, colMap, v.substring(0, 50), colMap.sale_price_effective_date));
        }
      }
    }
    results.push(makeResult(prefix, 'Sale price date not expired', 'High',
      saleDatePast === 0 ? 'PASS' : 'WARNING',
      saleDatePast === 0 ? 'No sale price effective dates have expired.' : saleDatePast + ' product(s) have sale_price_effective_date that has already ended. These sale prices are no longer active.',
      saleDatePast, total, saleDatePastEx));
  } else {
    results.push(makeResult(prefix, 'Sale price date not expired', 'High', 'SKIP', 'Sale price effective date column not found.', 0, total, []));
  }

  // --- Unit pricing measure ---
  if (colMap.unit_pricing_measure !== -1) {
    var upmInvalid = 0, upmEx = [];
    var validUnits = ['oz', 'lb', 'mg', 'g', 'kg', 'floz', 'pt', 'qt', 'gal', 'ml', 'cl', 'l', 'cbm', 'in', 'ft', 'yd', 'cm', 'm', 'sqft', 'sqm', 'ct', 'sheet', 'item'];
    var upmRegex = /^(\d+\.?\d*)\s*([a-zA-Z]+)$/;

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.unit_pricing_measure);
      if (v === '') continue;
      var match = upmRegex.exec(v.trim());
      if (!match || validUnits.indexOf(match[2].toLowerCase()) === -1) {
        upmInvalid++;
        if (upmEx.length < MAX_EXAMPLES) upmEx.push(exampleObj(i, rows, colMap, v, colMap.unit_pricing_measure));
      }
    }

    results.push(makeResult(prefix, 'Unit pricing measure valid format', 'High',
      upmInvalid === 0 ? 'PASS' : 'FAIL',
      upmInvalid === 0 ? 'All unit pricing measure values have valid format.' : upmInvalid + ' unit_pricing_measure value(s) have invalid format. Expected: positive number + unit (e.g., "750ml", "100g"). Valid units: oz, lb, mg, g, kg, floz, pt, qt, gal, ml, cl, l, cbm, in, ft, yd, cm, m, sqft, sqm, ct.',
      upmInvalid, total, upmEx));
  } else {
    results.push(makeResult(prefix, 'Unit pricing measure valid format', 'High', 'SKIP', 'Unit pricing measure column not found.', 0, total, []));
  }

  // --- Unit pricing base measure ---
  if (colMap.unit_pricing_base_measure !== -1 && colMap.unit_pricing_measure !== -1) {
    // Check that base measure uses the same unit type as measure
    var unitMismatch = 0, unitMisEx = [];
    var upmBaseRegex = /^(\d+\.?\d*)\s*([a-zA-Z]+)$/;

    for (var i = 0; i < rows.length; i++) {
      var measure = cellStr(rows[i], colMap.unit_pricing_measure);
      var baseMeasure = cellStr(rows[i], colMap.unit_pricing_base_measure);
      if (measure === '' || baseMeasure === '') continue;

      var mMatch = upmBaseRegex.exec(measure.trim());
      var bMatch = upmBaseRegex.exec(baseMeasure.trim());
      if (mMatch && bMatch && mMatch[2].toLowerCase() !== bMatch[2].toLowerCase()) {
        unitMismatch++;
        if (unitMisEx.length < MAX_EXAMPLES) unitMisEx.push(exampleObj(i, rows, colMap, measure + ' vs base ' + baseMeasure, colMap.unit_pricing_measure));
      }
    }

    results.push(makeResult(prefix, 'Unit pricing measure/base same unit', 'High',
      unitMismatch === 0 ? 'PASS' : 'FAIL',
      unitMismatch === 0 ? 'All unit pricing measure and base measure use the same unit.' : unitMismatch + ' product(s) use different units for unit_pricing_measure and unit_pricing_base_measure. Both must use the same unit type.',
      unitMismatch, total, unitMisEx));
  } else {
    results.push(makeResult(prefix, 'Unit pricing measure/base same unit', 'High', 'SKIP', 'Unit pricing base measure column not found.', 0, total, []));
  }

  // --- Availability: preorder/backorder requires availability_date ---
  if (colMap.availability !== -1) {
    var needsAvailDate = 0, needsAvailDateEx = [];
    var hasAvailDateCol = colMap.availability_date !== -1;

    for (var i = 0; i < rows.length; i++) {
      var avail = cellStr(rows[i], colMap.availability).toLowerCase();
      if (avail === 'preorder' || avail === 'pre-order' || avail === 'pre order' ||
          avail === 'backorder' || avail === 'back order' || avail === 'back_order') {
        var availDate = hasAvailDateCol ? cellStr(rows[i], colMap.availability_date) : '';
        if (availDate === '') {
          needsAvailDate++;
          if (needsAvailDateEx.length < MAX_EXAMPLES) needsAvailDateEx.push(exampleObj(i, rows, colMap, 'availability=' + avail + ', no date', colMap.availability));
        }
      }
    }

    results.push(makeResult(prefix, 'Preorder/backorder has availability_date', 'High',
      needsAvailDate === 0 ? 'PASS' : 'FAIL',
      needsAvailDate === 0 ? 'All preorder/backorder products have availability_date set.' : needsAvailDate + ' product(s) have availability set to preorder or backorder but are missing availability_date. Google requires this date for preorder/backorder items.',
      needsAvailDate, total, needsAvailDateEx));
  } else {
    results.push(makeResult(prefix, 'Preorder/backorder has availability_date', 'High', 'SKIP', 'Availability column not found.', 0, total, []));
  }

  // --- GTIN: restricted and coupon prefix ranges ---
  if (colMap.gtin !== -1) {
    var gtinRestricted = 0, gtinRestEx = [];
    var gtinCoupon = 0, gtinCouponEx = [];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.gtin);
      if (v === '') continue;
      var digits = v.replace(/[\s\-]/g, '').replace(/[^0-9]/g, '');
      if (digits.length < 8) continue;

      // Check prefix for restricted ranges (GS1 prefixes 02, 04, or 2x for 12+ digit GTINs)
      var prefix2 = digits.substring(0, 2);
      // For UPC-12/EAN-13/GTIN-14, leading digits indicate prefix
      if (prefix2 === '02' || prefix2 === '04') {
        gtinRestricted++;
        if (gtinRestEx.length < MAX_EXAMPLES) gtinRestEx.push(exampleObj(i, rows, colMap, v + ' (prefix ' + prefix2 + ')', colMap.gtin));
      } else if (digits.length >= 12 && digits[0] === '2') {
        // GS1 prefix range 20-29 is restricted (variable measure)
        gtinRestricted++;
        if (gtinRestEx.length < MAX_EXAMPLES) gtinRestEx.push(exampleObj(i, rows, colMap, v + ' (prefix 2x = variable measure)', colMap.gtin));
      }

      // Check for coupon prefixes (05, 98, 99)
      if (prefix2 === '05' || prefix2 === '98' || prefix2 === '99') {
        gtinCoupon++;
        if (gtinCouponEx.length < MAX_EXAMPLES) gtinCouponEx.push(exampleObj(i, rows, colMap, v + ' (coupon prefix ' + prefix2 + ')', colMap.gtin));
      }
    }

    results.push(makeResult(prefix, 'GTIN not in restricted range', 'High',
      gtinRestricted === 0 ? 'PASS' : 'FAIL',
      gtinRestricted === 0 ? 'No GTINs use restricted GS1 prefixes.' : gtinRestricted + ' GTIN(s) use restricted GS1 prefixes (02, 04, or 2x). These are reserved for internal/variable measure use and will be rejected.',
      gtinRestricted, total, gtinRestEx));

    results.push(makeResult(prefix, 'GTIN not in coupon range', 'High',
      gtinCoupon === 0 ? 'PASS' : 'FAIL',
      gtinCoupon === 0 ? 'No GTINs use coupon-range GS1 prefixes.' : gtinCoupon + ' GTIN(s) use coupon-range GS1 prefixes (05, 98, 99). These are reserved for coupons, not products.',
      gtinCoupon, total, gtinCouponEx));
  }

  // --- Price: max 2 decimal places ---
  if (colMap.price !== -1) {
    var priceDecErrors = 0, priceDecEx = [];
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.price);
      if (v === '') continue;
      var decMatch = v.match(/\.(\d{3,})/);
      if (decMatch) {
        priceDecErrors++;
        if (priceDecEx.length < MAX_EXAMPLES) priceDecEx.push(exampleObj(i, rows, colMap, v, colMap.price));
      }
    }
    results.push(makeResult(prefix, 'Price max 2 decimal places', 'Medium',
      priceDecErrors === 0 ? 'PASS' : 'WARNING',
      priceDecErrors === 0 ? 'All prices have 2 or fewer decimal places.' : priceDecErrors + ' price(s) have more than 2 decimal digits. Google will silently round (e.g., 1.0234 → 1.02), which may cause landing page mismatch.',
      priceDecErrors, total, priceDecEx));
  }

  // --- Product type: max 750 chars and comma misuse ---
  if (colMap.product_type !== -1) {
    var ptTooLong = 0, ptTooLongEx = [];
    var ptComma = 0, ptCommaEx = [];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.product_type);
      if (v === '') continue;
      if (v.length > 750) {
        ptTooLong++;
        if (ptTooLongEx.length < MAX_EXAMPLES) ptTooLongEx.push(exampleObj(i, rows, colMap, v.length + ' chars', colMap.product_type));
      }
      // Commas in product_type are interpreted as multiple product types by Google
      if (/,/.test(v) && /\s*>\s*/.test(v)) {
        ptComma++;
        if (ptCommaEx.length < MAX_EXAMPLES) ptCommaEx.push(exampleObj(i, rows, colMap, v.substring(0, 50), colMap.product_type));
      }
    }

    results.push(makeResult(prefix, 'Product type max 750 characters', 'Medium',
      ptTooLong === 0 ? 'PASS' : 'FAIL',
      ptTooLong === 0 ? 'All product type values are within 750 characters.' : ptTooLong + ' product type(s) exceed 750 characters.',
      ptTooLong, total, ptTooLongEx));

    results.push(makeResult(prefix, 'Product type no commas within value', 'Medium',
      ptComma === 0 ? 'PASS' : 'WARNING',
      ptComma === 0 ? 'No commas found in product type values.' : ptComma + ' product type(s) contain commas alongside > separators. Google interprets commas as separating different product types. Use > only (e.g., "Home > Garden > Tools" not "Home, Garden > Tools").',
      ptComma, total, ptCommaEx));
  }

  // --- MPN: max 70 characters ---
  if (colMap.mpn !== -1) {
    var mpnTooLong = 0, mpnLongEx = [];
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.mpn);
      if (v === '' || v.length <= 70) continue;
      mpnTooLong++;
      if (mpnLongEx.length < MAX_EXAMPLES) mpnLongEx.push(exampleObj(i, rows, colMap, v.length + ' chars', colMap.mpn));
    }
    results.push(makeResult(prefix, 'MPN max 70 characters', 'High',
      mpnTooLong === 0 ? 'PASS' : 'FAIL',
      mpnTooLong === 0 ? 'All MPN values are within 70 characters.' : mpnTooLong + ' MPN(s) exceed 70 characters. Google will reject these.',
      mpnTooLong, total, mpnLongEx));
  }

  // --- identifier_exists: cross-check with GTIN/MPN/brand ---
  if (colMap.identifier_exists !== -1) {
    var idExistsMismatch = 0, idExistsMisEx = [];
    var idExistsInvalid = 0, idExistsInvEx = [];
    var validIdExists = ['yes', 'true', 'no', 'false'];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.identifier_exists).toLowerCase();
      if (v === '') continue;

      // Valid values check
      if (validIdExists.indexOf(v) === -1) {
        idExistsInvalid++;
        if (idExistsInvEx.length < MAX_EXAMPLES) idExistsInvEx.push(exampleObj(i, rows, colMap, v, colMap.identifier_exists));
        continue;
      }

      // Cross-check: identifier_exists=no/false is only meaningful when no unique identifier exists.
      // Per Google Merchant spec, a unique identifier means GTIN or MPN. Brand alone does NOT
      // qualify as a unique identifier, so a product with only brand populated can legitimately
      // have identifier_exists=no (brand is used for categorization, not product identification).
      if (v === 'no' || v === 'false') {
        var hasGtin = colMap.gtin >= 0 && cellStr(rows[i], colMap.gtin) !== '';
        var hasMpn = colMap.mpn >= 0 && cellStr(rows[i], colMap.mpn) !== '';
        if (hasGtin || hasMpn) {
          idExistsMismatch++;
          var present = [];
          if (hasGtin) present.push('GTIN');
          if (hasMpn) present.push('MPN');
          if (idExistsMisEx.length < MAX_EXAMPLES) idExistsMisEx.push(exampleObj(i, rows, colMap, 'identifier_exists=no but has ' + present.join(', '), colMap.identifier_exists));
        }
      }
    }

    results.push(makeResult(prefix, 'identifier_exists valid values', 'High',
      idExistsInvalid === 0 ? 'PASS' : 'FAIL',
      idExistsInvalid === 0 ? 'All identifier_exists values are valid.' : idExistsInvalid + ' identifier_exists value(s) are invalid. Must be: yes, true, no, or false.',
      idExistsInvalid, total, idExistsInvEx));

    results.push(makeResult(prefix, 'identifier_exists matches identifiers', 'Medium',
      idExistsMismatch === 0 ? 'PASS' : 'WARNING',
      idExistsMismatch === 0 ? 'All identifier_exists values match the presence of identifiers.' : idExistsMismatch + ' product(s) have identifier_exists=no/false but still have GTIN or MPN populated. If a unique identifier exists, set identifier_exists to "yes" or remove the attribute.',
      idExistsMismatch, total, idExistsMisEx));
  } else {
    results.push(makeResult(prefix, 'identifier_exists valid values', 'High', 'SKIP', 'identifier_exists column not found.', 0, total, []));
    results.push(makeResult(prefix, 'identifier_exists matches identifiers', 'Medium', 'SKIP', 'identifier_exists column not found.', 0, total, []));
  }

  // --- Condition: cross-check with title ---
  if (colMap.condition !== -1 && colMap.title !== -1) {
    var condMismatch = 0, condMisEx = [];
    var usedRefurbRegex = /\b(refurbished|refurb|renewed|reconditioned|remanufactured|pre[- ]?owned|used|second[- ]?hand|open[- ]?box)\b/i;

    for (var i = 0; i < rows.length; i++) {
      var cond = cellStr(rows[i], colMap.condition).toLowerCase();
      var title = cellStr(rows[i], colMap.title);
      if (cond === '' || title === '') continue;

      // Title suggests used/refurbished but condition says new
      if (cond === 'new' && usedRefurbRegex.test(title)) {
        condMismatch++;
        if (condMisEx.length < MAX_EXAMPLES) {
          var matchWord = title.match(usedRefurbRegex);
          condMisEx.push(exampleObj(i, rows, colMap, 'condition=new but title has "' + (matchWord ? matchWord[0] : '') + '"', colMap.condition));
        }
      }
    }

    results.push(makeResult(prefix, 'Condition matches title', 'High',
      condMismatch === 0 ? 'PASS' : 'WARNING',
      condMismatch === 0 ? 'Condition values are consistent with title text.' : condMismatch + ' product(s) have condition=new but title contains terms like "refurbished", "used", or "open box". Condition mismatch can cause disapproval.',
      condMismatch, total, condMisEx));
  }

  // --- Multipack: valid format ---
  if (colMap.multipack !== -1) {
    var mpkInvalid = 0, mpkEx = [];
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.multipack);
      if (v === '') continue;
      var num = parseInt(v, 10);
      if (isNaN(num) || num < 2 || String(num) !== v.trim()) {
        mpkInvalid++;
        if (mpkEx.length < MAX_EXAMPLES) mpkEx.push(exampleObj(i, rows, colMap, v, colMap.multipack));
      }
    }
    results.push(makeResult(prefix, 'Multipack valid integer (>= 2)', 'Medium',
      mpkInvalid === 0 ? 'PASS' : 'FAIL',
      mpkInvalid === 0 ? 'All multipack values are valid integers >= 2.' : mpkInvalid + ' multipack value(s) are not valid integers >= 2. Multipack indicates the number of identical products grouped together.',
      mpkInvalid, total, mpkEx));
  } else {
    results.push(makeResult(prefix, 'Multipack valid integer (>= 2)', 'Medium', 'SKIP', 'Multipack column not found.', 0, total, []));
  }

  // --- is_bundle: valid boolean ---
  if (colMap.is_bundle !== -1) {
    var bundleInvalid = 0, bundleEx = [];
    var validBool = ['yes', 'true', 'no', 'false'];
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.is_bundle).toLowerCase();
      if (v === '') continue;
      if (validBool.indexOf(v) === -1) {
        bundleInvalid++;
        if (bundleEx.length < MAX_EXAMPLES) bundleEx.push(exampleObj(i, rows, colMap, v, colMap.is_bundle));
      }
    }
    results.push(makeResult(prefix, 'is_bundle valid values', 'Medium',
      bundleInvalid === 0 ? 'PASS' : 'FAIL',
      bundleInvalid === 0 ? 'All is_bundle values are valid.' : bundleInvalid + ' is_bundle value(s) are invalid. Must be: yes, true, no, or false.',
      bundleInvalid, total, bundleEx));
  } else {
    results.push(makeResult(prefix, 'is_bundle valid values', 'Medium', 'SKIP', 'is_bundle column not found.', 0, total, []));
  }

  // --- Age group: required for Apparel (GPC 166) ---
  if (colMap.age_group !== -1 && colMap.google_product_category !== -1) {
    var ageGroupMissing = 0, ageMisEx = [];
    for (var i = 0; i < rows.length; i++) {
      var gpc = cellStr(rows[i], colMap.google_product_category).toLowerCase();
      var ageVal = cellStr(rows[i], colMap.age_group);
      // Check if GPC is apparel-related (ID 166 or text contains "apparel" or "clothing")
      if ((gpc === '166' || /\bapparel\b/i.test(gpc) || /\bclothing\b/i.test(gpc)) && ageVal === '') {
        ageGroupMissing++;
        if (ageMisEx.length < MAX_EXAMPLES) ageMisEx.push(exampleObj(i, rows, colMap, 'Apparel product, no age_group', colMap.google_product_category));
      }
    }
    results.push(makeResult(prefix, 'Age group set for apparel', 'High',
      ageGroupMissing === 0 ? 'PASS' : 'WARNING',
      ageGroupMissing === 0 ? 'All apparel products have age_group set.' : ageGroupMissing + ' apparel product(s) are missing age_group. Google requires age_group for Apparel & Accessories (GPC 166) products.',
      ageGroupMissing, total, ageMisEx));
  }

  // --- Gap 5: Ads redirect domain must match link domain ---
  if (colMap.ads_redirect !== -1 && colMap.link !== -1) {
    var adsDomainMismatch = 0, adsDomainEx = [];
    var domainRegex = /^https?:\/\/([^\/\?#]+)/i;

    for (var i = 0; i < rows.length; i++) {
      var linkVal = cellStr(rows[i], colMap.link);
      var adsVal = cellStr(rows[i], colMap.ads_redirect);
      if (linkVal === '' || adsVal === '') continue;

      var linkMatch = domainRegex.exec(linkVal);
      var adsMatch = domainRegex.exec(adsVal);
      if (linkMatch && adsMatch && linkMatch[1].toLowerCase() !== adsMatch[1].toLowerCase()) {
        adsDomainMismatch++;
        if (adsDomainEx.length < MAX_EXAMPLES) adsDomainEx.push(exampleObj(i, rows, colMap, 'link=' + linkMatch[1] + ' vs ads_redirect=' + adsMatch[1], colMap.ads_redirect));
      }
    }

    results.push(makeResult(prefix, 'Ads redirect domain matches link', 'High',
      adsDomainMismatch === 0 ? 'PASS' : 'FAIL',
      adsDomainMismatch === 0 ? 'All ads_redirect domains match product link domains.' : adsDomainMismatch + ' product(s) have ads_redirect domain that doesn\'t match the link domain. With parallel tracking, mismatched domains break tracking.',
      adsDomainMismatch, total, adsDomainEx));
  } else {
    results.push(makeResult(prefix, 'Ads redirect domain matches link', 'High', 'SKIP', 'Ads redirect column not found.', 0, total, []));
  }

  // --- Gap 6: Promotion ID format validation ---
  if (colMap.promotion_id !== -1) {
    var promoIdIssues = 0, promoIdEx = [];
    var promoIdCharsRegex = /[^a-zA-Z0-9_\-]/; // Only alphanumeric, underscores, dashes allowed

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.promotion_id);
      if (v === '') continue;

      var issue = '';
      if (v.length > 50) issue = v.length + ' chars (max 50)';
      else if (/\s/.test(v)) issue = 'contains whitespace';
      else if (promoIdCharsRegex.test(v)) issue = 'invalid chars: ' + v.match(promoIdCharsRegex)[0];

      if (issue !== '') {
        promoIdIssues++;
        if (promoIdEx.length < MAX_EXAMPLES) promoIdEx.push(exampleObj(i, rows, colMap, issue, colMap.promotion_id));
      }
    }

    results.push(makeResult(prefix, 'Promotion ID valid format', 'Medium',
      promoIdIssues === 0 ? 'PASS' : 'FAIL',
      promoIdIssues === 0 ? 'All promotion ID values have valid format.' : promoIdIssues + ' promotion_id value(s) have format issues. Must be 1-50 chars, alphanumeric/underscores/dashes only, no whitespace or symbols.',
      promoIdIssues, total, promoIdEx));
  } else {
    results.push(makeResult(prefix, 'Promotion ID valid format', 'Medium', 'SKIP', 'Promotion ID column not found.', 0, total, []));
  }

  // --- Gap 7: Price = $0 warning ---
  if (colMap.price !== -1) {
    var zeroPrice = 0, zeroPriceEx = [];
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.price);
      if (v === '') continue;
      var num = parsePrice(v);
      if (!isNaN(num) && num === 0) {
        zeroPrice++;
        if (zeroPriceEx.length < MAX_EXAMPLES) zeroPriceEx.push(exampleObj(i, rows, colMap, v, colMap.price));
      }
    }
    results.push(makeResult(prefix, 'Price not zero', 'High',
      zeroPrice === 0 ? 'PASS' : 'WARNING',
      zeroPrice === 0 ? 'No products have zero price.' : zeroPrice + ' product(s) have price = $0. This is only valid for physical goods subscriptions (using subscription_cost attribute). Otherwise, zero-priced products will be disapproved.',
      zeroPrice, total, zeroPriceEx));
  }

  // --- Gap 8: Google-specific availability values ---
  if (colMap.availability !== -1) {
    var nonGoogleAvail = 0, nonGoogleAvailEx = [];
    var googleValidAvail = ['in_stock', 'in stock', 'out_of_stock', 'out of stock', 'preorder', 'pre-order', 'backorder', 'back_order'];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.availability).toLowerCase();
      if (v === '') continue;
      if (googleValidAvail.indexOf(v) === -1) {
        // Check if it's a Shopify/platform-specific value that won't work in Google
        if (v === 'active' || v === 'draft' || v === 'archived' || v === 'discontinued') {
          nonGoogleAvail++;
          if (nonGoogleAvailEx.length < MAX_EXAMPLES) nonGoogleAvailEx.push(exampleObj(i, rows, colMap, '"' + v + '" is not a valid Google value', colMap.availability));
        }
      }
    }

    results.push(makeResult(prefix, 'Availability uses Google values', 'High',
      nonGoogleAvail === 0 ? 'PASS' : 'FAIL',
      nonGoogleAvail === 0 ? 'All availability values use Google-accepted values.' : nonGoogleAvail + ' product(s) use platform-specific availability values (e.g., "active", "draft", "archived") instead of Google\'s accepted values: in_stock, out_of_stock, preorder, backorder.',
      nonGoogleAvail, total, nonGoogleAvailEx));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check: Meta Specific
// ---------------------------------------------------------------------------

function checkMeta(rows, colMap, total, platform) {
  var results = [];
  var prefix = platform === 'generic' ? 'Meta Catalog' : 'Meta Catalog';

  // Content ID present
  var idCol = colMap.content_id !== -1 ? colMap.content_id : colMap.id;
  if (idCol === -1) {
    results.push(makeResult(prefix, 'Content ID present', 'Critical', 'SKIP', 'Content ID / ID column not found.', 0, total, []))
  } else {
    var cidBlanks = 0;
    for (var i = 0; i < rows.length; i++) {
      if (cellStr(rows[i], idCol) === '') cidBlanks++;
    }

    results.push(makeResult(prefix, 'Content ID present', 'Critical',
      cidBlanks === 0 ? 'PASS' : 'FAIL',
      cidBlanks === 0 ? 'All products have a content ID.' : cidBlanks + ' product(s) missing content ID.',
      cidBlanks, total, []))
  }

  // UTM parameters in URLs
  if (colMap.link === -1) {
    results.push(makeResult(prefix, 'UTM parameters in URLs', 'Low', 'SKIP', 'Link/URL column not found.', 0, total, []))
  } else {
    var utmCount = 0;
    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.link);
      if (v !== '' && /utm_/i.test(v)) utmCount++;
    }

    var nonBlankLinks = 0;
    for (var i = 0; i < rows.length; i++) {
      if (cellStr(rows[i], colMap.link) !== '') nonBlankLinks++;
    }

    results.push(makeResult(prefix, 'UTM parameters in URLs', 'Low',
      utmCount > 0 ? 'PASS' : 'WARNING',
      utmCount > 0
        ? utmCount + ' of ' + nonBlankLinks + ' URLs contain UTM parameters for attribution tracking.'
        : 'No UTM parameters detected in product URLs. Consider adding UTM parameters for Meta campaign attribution.',
      utmCount > 0 ? 0 : nonBlankLinks, total, []))
  }

  return results;
}

// ---------------------------------------------------------------------------
// Check: Shopify Specific
// ---------------------------------------------------------------------------

function checkShopify(rows, colMap, total, platform) {
  var results = [];
  var prefix = platform === 'generic' ? 'Shopify' : 'Shopify';

  // Handle present
  if (colMap.handle === -1) {
    results.push(makeResult(prefix, 'Handle present', 'High', 'SKIP', 'Handle column not found.', 0, total, []))
  } else {
    var handleBlanks = 0;
    for (var i = 0; i < rows.length; i++) {
      if (cellStr(rows[i], colMap.handle) === '') handleBlanks++;
    }

    results.push(makeResult(prefix, 'Handle present', 'High',
      handleBlanks === 0 ? 'PASS' : 'FAIL',
      handleBlanks === 0 ? 'All products have a handle.' : handleBlanks + ' product(s) missing handle.',
      handleBlanks, total, []))
  }

  // Variant SKU present
  if (colMap.variant_sku === -1) {
    results.push(makeResult(prefix, 'Variant SKU present', 'Medium', 'SKIP', 'Variant SKU / SKU column not found.', 0, total, []))
  } else {
    var skuBlanks = 0;
    for (var i = 0; i < rows.length; i++) {
      if (cellStr(rows[i], colMap.variant_sku) === '') skuBlanks++;
    }

    results.push(makeResult(prefix, 'Variant SKU present', 'Medium',
      skuBlanks === 0 ? 'PASS' : 'WARNING',
      skuBlanks === 0 ? 'All products have a variant SKU.' : skuBlanks + ' product(s) missing variant SKU.',
      skuBlanks, total, []))
  }

  // Product status
  if (colMap.availability === -1) {
    results.push(makeResult(prefix, 'Product status valid', 'Medium', 'SKIP', 'Status column not found.', 0, total, []))
  } else {
    var statusInvalid = 0;
    var validStatuses = ['active', 'draft', 'archived', 'in_stock', 'in stock', 'out_of_stock', 'out of stock', 'preorder', 'backorder'];

    for (var i = 0; i < rows.length; i++) {
      var v = cellStr(rows[i], colMap.availability).toLowerCase();
      if (v === '') continue;
      if (validStatuses.indexOf(v) === -1) statusInvalid++;
    }

    results.push(makeResult(prefix, 'Product status valid', 'Medium',
      statusInvalid === 0 ? 'PASS' : 'WARNING',
      statusInvalid === 0 ? 'All product statuses are valid.' : statusInvalid + ' product(s) have unrecognized status values.',
      statusInvalid, total, []))
  }

  return results;
}

// ---------------------------------------------------------------------------
// Output: Write Results to "Audit Results" Sheet
// ---------------------------------------------------------------------------

function writeResults(ss, results, total, platform, tabName, feedSheetName) {
  // Delete existing tab for this platform + source combo if present
  var existing = ss.getSheetByName(tabName);
  if (existing) ss.deleteSheet(existing);

  var sheet = ss.insertSheet(tabName);

  // --- Header row ---
  var headerRow = ['Category', 'Check', 'Severity', 'Status', 'Details', 'Products Affected', '% of Total',
                   'Example 1', 'Example 2', 'Example 3', 'Example 4', 'Example 5'];
  sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);

  // Style header
  var headerRange = sheet.getRange(1, 1, 1, headerRow.length);
  headerRange.setBackground('#1a1a2e')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center');

  // --- Write check results ---
  // Write the core data columns (1-7) as a batch
  if (results.length > 0) {
    var dataRows = results.map(function(r) { return r.data; });
    sheet.getRange(2, 1, results.length, 7).setValues(dataRows);
  }

  // --- Write example columns (8-12) with hyperlinks ---
  for (var r = 0; r < results.length; r++) {
    var rowNum = r + 2;
    var examples = results[r].examples;
    for (var e = 0; e < MAX_EXAMPLES; e++) {
      var col = 8 + e; // columns 8-12
      var cell = sheet.getRange(rowNum, col);
      if (e < examples.length) {
        var ex = examples[e];
        // Build a hyperlink to the row in Feed Data sheet
        // Link navigates to the exact cell with the issue
        var displayText = ex.label + (ex.value ? ': ' + ex.value : '');
        cell.setFormula('=HYPERLINK("#gid=' + getFeedSheetGid(ss, feedSheetName) + '&range=' + ex.col + ex.row + '","' + displayText.replace(/"/g, '""') + '")');
        cell.setFontColor('#1155cc');
        cell.setFontSize(9);
      }
    }
  }

  // --- Color-code Status column (col 4) and Severity column (col 3) ---
  for (var r = 0; r < results.length; r++) {
    var rowNum = r + 2;

    // Status coloring (column 4)
    var status = results[r].data[3];
    var statusCell = sheet.getRange(rowNum, 4);
    statusCell.setFontWeight('bold');
    switch (status) {
      case 'PASS':
        statusCell.setBackground('#d4edda').setFontColor('#155724');
        break;
      case 'FAIL':
        statusCell.setBackground('#f8d7da').setFontColor('#721c24');
        break;
      case 'WARNING':
        statusCell.setBackground('#fff3cd').setFontColor('#856404');
        break;
      case 'SKIP':
        statusCell.setBackground('#e2e3e5').setFontColor('#6c757d');
        break;
    }

    // Severity coloring (column 3)
    var severity = results[r].data[2];
    var sevCell = sheet.getRange(rowNum, 3);
    sevCell.setFontWeight('bold');
    switch (severity) {
      case 'Critical':
        sevCell.setBackground('#f8d7da').setFontColor('#721c24');
        break;
      case 'High':
        sevCell.setBackground('#ffe0b2').setFontColor('#e65100');
        break;
      case 'Medium':
        sevCell.setBackground('#fff3cd').setFontColor('#856404');
        break;
      case 'Low':
        sevCell.setBackground('#e2e3e5').setFontColor('#6c757d');
        break;
    }
  }

  // --- Summary section ---
  var summaryStartRow = results.length + 4;
  var passCount = 0;
  var failCount = 0;
  var warningCount = 0;
  var skipCount = 0;
  var criticalFails = 0;
  var highFails = 0;

  for (var r = 0; r < results.length; r++) {
    var status = results[r].data[3];
    var severity = results[r].data[2];
    if (status === 'PASS') passCount++;
    else if (status === 'FAIL') {
      failCount++;
      if (severity === 'Critical') criticalFails++;
      if (severity === 'High') highFails++;
    }
    else if (status === 'WARNING') warningCount++;
    else if (status === 'SKIP') skipCount++;
  }

  var totalChecks = passCount + failCount + warningCount; // exclude SKIP from rate calc
  var passRate = totalChecks > 0 ? (passCount / totalChecks * 100) : 0;

  // Health score: start at 100, deduct for failures
  var healthScore = 100;
  healthScore -= criticalFails * 15;   // Critical failures cost 15 pts each
  healthScore -= highFails * 8;        // High failures cost 8 pts each
  healthScore -= (failCount - criticalFails - highFails) * 4;  // Other failures cost 4 pts
  healthScore -= warningCount * 1;     // Warnings cost 1 pt each
  if (healthScore < 0) healthScore = 0;

  var platformLabel = 'Generic';
  if (platform === 'google') platformLabel = 'Google Merchant Center';
  if (platform === 'meta') platformLabel = 'Meta Catalog';
  if (platform === 'shopify') platformLabel = 'Shopify';

  // Summary header
  var summaryHeader = sheet.getRange(summaryStartRow, 1, 1, 3);
  summaryHeader.merge();
  summaryHeader.setValue('AUDIT SUMMARY')
    .setBackground('#1a1a2e')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(12)
    .setHorizontalAlignment('center');

  var checksRan = passCount + failCount + warningCount;
  var summaryData = [
    ['Platform', platformLabel, ''],
    ['Total Products Analyzed', fmtNum(total), ''],
    ['', '', ''],
    ['Total Checks Available', results.length, ''],
    ['Checks Ran', checksRan, ''],
    ['Checks Skipped (column not detected)', skipCount, ''],
    ['', '', ''],
    ['Passed', passCount, ''],
    ['Failed', failCount, ''],
    ['Warnings', warningCount, ''],
    ['', '', ''],
    ['Pass Rate (of checks ran)', passRate.toFixed(1) + '%', ''],
    ['Critical Failures', criticalFails, ''],
    ['High Failures', highFails, ''],
    ['', '', ''],
    ['HEALTH SCORE', healthScore + ' / 100', ''],
    ['', '', ''],
    ['NOTE', 'Skipped checks indicate that the required column was not detected in your feed. This may mean the column is absent, or it may be named differently than expected. Review skipped checks to verify.', ''],
    ['', '', ''],
    ['SUPPORT', 'Questions or feedback? Contact alex@snowforge.dev', ''],
    ['', 'https://snowforge.dev', '']
  ];

  sheet.getRange(summaryStartRow + 1, 1, summaryData.length, 3).setValues(summaryData);

  // Style summary labels (column A bold)
  var summaryLabelRange = sheet.getRange(summaryStartRow + 1, 1, summaryData.length, 1);
  summaryLabelRange.setFontWeight('bold');

  // Style health score row
  var healthRow = summaryStartRow + summaryData.length; // last row of summaryData
  var healthScoreRange = sheet.getRange(healthRow, 1, 1, 3);
  healthScoreRange.setFontSize(14).setFontWeight('bold');

  if (healthScore >= 80) {
    healthScoreRange.setBackground('#d4edda').setFontColor('#155724');
  } else if (healthScore >= 50) {
    healthScoreRange.setBackground('#fff3cd').setFontColor('#856404');
  } else {
    healthScoreRange.setBackground('#f8d7da').setFontColor('#721c24');
  }

  // Style the pass rate row (index 12 in summaryData = row summaryStartRow + 13)
  var passRateRow = summaryStartRow + 13;
  var passRateRange = sheet.getRange(passRateRow, 2);
  passRateRange.setFontWeight('bold').setFontSize(11);
  if (passRate >= 80) {
    passRateRange.setFontColor('#155724');
  } else if (passRate >= 50) {
    passRateRange.setFontColor('#856404');
  } else {
    passRateRange.setFontColor('#721c24');
  }

  // Style the NOTE row
  var noteRow = summaryStartRow + 19;
  var noteRange = sheet.getRange(noteRow, 1, 1, 1);
  noteRange.setFontWeight('bold').setFontColor('#856404');
  sheet.getRange(noteRow, 2, 1, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  // Style the SUPPORT row
  var supportRow = summaryStartRow + 21;
  sheet.getRange(supportRow, 1, 1, 1).setFontWeight('bold');
  sheet.getRange(supportRow, 2, 1, 1).setFontColor('#1155cc');
  sheet.getRange(supportRow + 1, 2, 1, 1).setFontColor('#1155cc');

  // --- Formatting ---
  // Freeze header row and add filter for sorting/filtering
  sheet.setFrozenRows(1);
  if (results.length > 0) {
    sheet.getRange(1, 1, results.length + 1, headerRow.length).createFilter();
  }

  // Auto-resize columns
  for (var c = 1; c <= headerRow.length; c++) {
    sheet.autoResizeColumn(c);
  }

  // Cap the Details column width at 600px so it doesn't stretch too far
  var detailsWidth = sheet.getColumnWidth(5);
  if (detailsWidth > 600) {
    sheet.setColumnWidth(5, 600);
  }

  // Set column widths for readability
  sheet.setColumnWidth(1, 150);  // Category
  sheet.setColumnWidth(2, 280);  // Check
  sheet.setColumnWidth(3, 90);   // Severity
  sheet.setColumnWidth(4, 90);   // Status
  // Column 5 (Details) auto-resized above
  sheet.setColumnWidth(6, 130);  // Products Affected
  sheet.setColumnWidth(7, 90);   // % of Total
  // Example columns
  for (var ec = 8; ec <= 12; ec++) {
    sheet.setColumnWidth(ec, 200);
  }

  // Center-align status and severity columns
  if (results.length > 0) {
    sheet.getRange(2, 3, results.length, 2).setHorizontalAlignment('center');
    sheet.getRange(2, 6, results.length, 2).setHorizontalAlignment('center');
    // Wrap text in Details column
    sheet.getRange(2, 5, results.length, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  }

  // Activate the results sheet
  sheet.activate();
}
