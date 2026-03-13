---
name: applovin-ads-integration
description: "Integrate AppLovin MAX mediation and ad campaigns for mobile commerce apps with user acquisition, retargeting, and in-app purchase event tracking"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [applovin, mobile-ads, app-marketing, max-mediation]
triggers: ["set up AppLovin ads", "mobile app user acquisition", "implement AppLovin MAX"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# AppLovin Ads Integration

## Overview

AppLovin is a leading mobile advertising platform combining the MAX mediation SDK (for monetizing your app with ads) and the AppLovin Ads demand-side platform (for acquiring users and running retargeting campaigns). For mobile ecommerce apps, AppLovin excels at in-app purchase (IAP) optimization, reward-based retargeting, and SKAdNetwork-compliant attribution in iOS privacy-safe environments. This skill covers SDK integration, purchase event postbacks, user acquisition campaign setup, and in-app bidding waterfall configuration.

## When to Use This Skill

- When monetizing a mobile commerce app with in-app advertising using MAX mediation
- When running user acquisition campaigns targeting high-intent mobile shoppers
- When setting up purchase event postbacks for ROAS-optimized bidding
- When migrating from MoPub/ironSource to AppLovin MAX mediation
- When implementing SKAdNetwork attribution for iOS 14+ compliance
- When building a retargeting campaign for users who added to cart but did not purchase

## Core Instructions

### 1. Install AppLovin MAX SDK

**iOS (Swift Package Manager or CocoaPods):**

```ruby
# Podfile
pod 'AppLovinSDK'
pod 'AppLovinMediationGoogleAdMobAdapter'
pod 'AppLovinMediationMetaAudienceNetworkAdapter'
```

Initialize in `AppDelegate`:

```swift
import AppLovinSDK

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(_ app: UIApplication,
                   didFinishLaunchingWithOptions opts: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    ALSdk.shared().mediationProvider = "max"
    ALSdk.shared().userIdentifier = currentUser?.id ?? ""  // your internal user ID
    ALSdk.shared().initializeSdk { sdkConfig in
      // SDK ready — load your first ad
    }
    return true
  }
}
```

**Android (Gradle):**

```groovy
// app/build.gradle
dependencies {
    implementation 'com.applovin:applovin-sdk:+'
    implementation 'com.applovin.mediation:google-adapter:+'
    implementation 'com.applovin.mediation:facebook-adapter:+'
}
```

```kotlin
// Application.onCreate()
AppLovinSdk.getInstance(this).apply {
    mediationProvider = "max"
    userIdentifier = currentUser?.id ?: ""
    initializeSdk {
        // SDK ready
    }
}
```

### 2. Configure purchase event postbacks

AppLovin uses postback URLs or MMP (Mobile Measurement Partner) integrations to receive purchase events. For direct postback without an MMP:

```typescript
// Server-side: call AppLovin's postback URL after a confirmed purchase
async function sendApplovinPurchasePostback(params: {
  userId: string;
  orderId: string;
  revenue: number;
  currency: string;
  idfa?: string;      // iOS IDFA (may be blank post-ATT)
  gaid?: string;      // Android GAID
  applovinId?: string; // AppLovin device ID (most reliable)
}) {
  const postbackUrl = new URL('https://d.applovin.com/postback/v1/purchase');
  postbackUrl.searchParams.set('event_token',  process.env.APPLOVIN_POSTBACK_TOKEN!);
  postbackUrl.searchParams.set('event_name',   'purchase');
  postbackUrl.searchParams.set('user_id',      params.userId);
  postbackUrl.searchParams.set('transaction_id', params.orderId);
  postbackUrl.searchParams.set('revenue',      params.revenue.toFixed(2));
  postbackUrl.searchParams.set('currency',     params.currency);
  if (params.idfa)       postbackUrl.searchParams.set('idfa', params.idfa);
  if (params.gaid)       postbackUrl.searchParams.set('gaid', params.gaid);
  if (params.applovinId) postbackUrl.searchParams.set('device_id', params.applovinId);

  const response = await fetch(postbackUrl.toString());
  if (!response.ok) {
    throw new Error(`AppLovin postback failed: ${response.status}`);
  }
}
```

Use an MMP (Adjust, AppsFlyer, Singular) in production — they handle deduplication across networks and SKAdNetwork attribution automatically.

### 3. Track in-app purchase events with the SDK (client-side)

In addition to server postbacks, fire client-side events for immediate signal:

```swift
// iOS — after a successful purchase
func trackPurchase(orderId: String, revenue: Double, currency: String) {
  let event = MAAdRevenue()
  // For IAP revenue tracking (not ad revenue):
  ALEventService.shared().trackEvent(ALEventTypePurchasedProduct, withParameters: [
    ALEventParameterRevenueAmount:   NSNumber(value: revenue),
    ALEventParameterRevenueCurrency: currency,
    ALEventParameterProductIdentifier: orderId,
  ])
}

// Track add-to-cart for retargeting signal
func trackAddToCart(productId: String, price: Double) {
  ALEventService.shared().trackEvent(ALEventTypeAddedItemToCart, withParameters: [
    ALEventParameterProductIdentifier: productId,
    ALEventParameterRevenueAmount:     NSNumber(value: price),
  ])
}
```

```kotlin
// Android
AppLovinSdk.getInstance(context).eventService.apply {
    trackEvent(AppLovinEventTypes.PURCHASE, mapOf(
        AppLovinEventParameters.REVENUE_AMOUNT   to revenue,
        AppLovinEventParameters.REVENUE_CURRENCY to currency,
        AppLovinEventParameters.PRODUCT_ID       to orderId,
    ))
}
```

### 4. Configure the MAX mediation waterfall (for app monetization)

In the MAX dashboard, set up your in-app bidding waterfall for interstitial and rewarded placements. Prioritize in-app bidding networks over traditional waterfall:

```
Placement: commerce_cart_interstitial
  In-App Bidding (highest priority — simultaneous auction):
    - AppLovin Exchange
    - Meta Audience Network
    - Google AdMob
  Traditional Waterfall (fallback):
    - Floor: $3.00 CPM → Vungle
    - Floor: $2.00 CPM → Unity Ads
    - Floor: $1.00 CPM → ironSource
```

Load and show ads in your app:

```swift
// Load interstitial
class CartViewController: UIViewController {
  var interstitialAd: MAInterstitialAd?

  override func viewDidLoad() {
    super.viewDidLoad()
    interstitialAd = MAInterstitialAd(adUnitIdentifier: "YOUR_AD_UNIT_ID")
    interstitialAd?.delegate = self
    interstitialAd?.load()
  }

  func showAdIfReady() {
    guard interstitialAd?.isReady == true else { return }
    interstitialAd?.show()
  }
}

extension CartViewController: MAAdDelegate {
  func didLoad(_ ad: MAAd) { /* Ad loaded, ready to show */ }
  func didFailToLoadAd(forAdUnitIdentifier id: String, withError error: MAError) {
    // Log and retry after exponential backoff
  }
  func didHide(_ ad: MAAd) {
    interstitialAd?.load() // Preload next ad immediately
  }
}
```

### 5. User acquisition campaign setup

In AppLovin's advertising dashboard (manage.applovin.com), create a campaign:

```
Campaign Type: App Install (iOS or Android)
Goal: Purchase (ROAS optimization)
Bid Strategy: Target ROAS — start at 200%, ramp up after 50+ purchases/day
Budget: $200/day minimum for ROAS campaigns (algorithm needs data)
Targeting:
  - Country: US, CA, GB, AU (tier-1 for highest ROAS)
  - Age: 25-54 (skews toward mobile spenders)
  - Device: iOS 14+, Android 10+ (exclude very old OS versions)
  - Audience: Lookalike of your top purchasers (upload from MMP)
Creative Rotation: Automatic
```

### 6. SKAdNetwork attribution (iOS 14+)

Register your conversion values in the SKAdNetwork schema. Map purchase value ranges to conversion value tiers (0–63):

```swift
// Define your conversion value schema (configure in AppLovin dashboard too)
// Values 0-63; higher = higher revenue
func updateSKANConversionValue(orderValue: Double) {
  let conversionValue: Int
  switch orderValue {
  case 0..<25:   conversionValue = 10
  case 25..<50:  conversionValue = 20
  case 50..<100: conversionValue = 30
  case 100..<200: conversionValue = 40
  case 200..<500: conversionValue = 50
  default:        conversionValue = 63
  }

  if #available(iOS 16.1, *) {
    // Fine-grained conversion values (SKAdNetwork 4.0)
    SKAdNetwork.updatePostbackConversionValue(conversionValue, coarseValue: .high, lockWindow: false) { error in
      if let error { print("SKAN update error: \(error)") }
    }
  } else {
    SKAdNetwork.updateConversionValue(conversionValue)
  }
}
```

Configure the same schema in AppLovin's SKAN configuration panel so the platform can decode the postbacks.

### 7. Retargeting campaigns for mobile commerce

Build retargeting audiences from MMP data and upload to AppLovin:

```typescript
// Export lapsed app users to a CSV for AppLovin audience upload
async function exportRetargetingAudience() {
  const users = await db.appUsers.findAll({
    where: {
      lastOpenedAt: { lt: subDays(new Date(), 7) },
      lastOpenedAt: { gt: subDays(new Date(), 30) },
      hasPlacedOrder: false,
      hasAddedToCart: true,
    },
    select: ['advertisingId', 'idfaHash', 'email'],
  });

  // Upload CSV to AppLovin Audience Manager
  return users.map(u => ({ idfa: u.idfaHash, gaid: u.advertisingId }));
}
```

## Best Practices

- **Use an MMP (Adjust, AppsFlyer, or Singular)** — direct postbacks miss cross-device attribution and SKAdNetwork decoding; MMPs handle this automatically
- **Set revenue postbacks to fire server-to-server** — client-side events can be spoofed; server postbacks give AppLovin reliable ROAS signal
- **Preload ads before they are needed** — call `load()` immediately after `didHide` to have an ad ready for the next impression opportunity
- **Use in-app bidding for all placements** — simultaneous auction (in-app bidding) outperforms sequential waterfall by 15–30% in eCPM
- **A/B test creatives every two weeks** — AppLovin's algorithm tires of creatives quickly; refresh with new video and playable ad formats
- **Cap frequency for retargeting** — limit retargeting ads to 3 impressions per user per day to avoid annoyance and banner blindness
- **Align SKAN conversion values with your revenue buckets** — misconfigured values cause ROAS reports to show wildly incorrect numbers
- **Pass AppLovin device ID (not just IDFA)** — AppLovin's proprietary device ID is more stable than IDFA post-ATT consent

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Purchase postbacks not registering | Verify postback token is correct; check server logs for HTTP errors; ensure `revenue` param uses decimal format, not integer |
| SDK fails to initialize on iOS | Add `NSUserTrackingUsageDescription` to Info.plist; implement ATT prompt before SDK init to maximize IDFA collection |
| ROAS campaign underspending | Lower your tROAS target; ensure you have 50+ purchase events/day for the algorithm to optimize against |
| In-app bidding earning less than waterfall | Check that all adapters are initialized correctly; bidding requires SDK adapters for each network, not just keys |
| SKAN conversion values showing all zeros | Confirm `updateConversionValue` is called after the final purchase confirmation, not just after payment intent |
| Rewarded ad not loading after first show | Always call `load()` in the `didHide` callback, not `didDisplay`; the latter fires before the ad completes |
| Android GAID missing in postbacks | Request `AD_ID` permission on Android 13+; user may have limited ad tracking in device settings |

## Related Skills

- @tiktok-ads-integration
- @meta-ads-integration
- @marketing-attribution-dashboard
- @push-notifications
- @customer-retention-engine
