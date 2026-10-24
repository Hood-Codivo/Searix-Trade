# Searix Trade resubmission

## Publisher website

Use https://www.searixtrade.com/ in the **publisher profile website** field and verify the saved value, as well as any app-level website field.

Checked on 24 October 2026: the exact URL returned HTTP 200 and readable, server-rendered Searix product content, with support contact and privacy/terms links. The bare domain redirected to this URL. This check does not establish what the reviewer saw or guarantee access from every region.

If this URL is rejected again, ask support for the exact URL tested, the review timestamp, and the observed error or screenshot. Check hosting protection and access logs against that time. Do not replace the site with an API endpoint.

## Permission changes

The native Android manifests and Expo blockedPermissions remove shared-storage read/write, boot-completed, launcher badge and Google Play install-referrer access. The release manifest also removes development overlay and Wi-Fi multicast discovery access. Expo config blocks these too for regenerated projects.

Keep and explain permissions used by the actual features:

- Internet/network state: backend market data, transaction submission and push transport.
- Biometric/fingerprint: optional app lock, enabled by the user in settings.
- Notifications: optional price/premium alerts, enabled by the user in settings.
- Vibration: notification feedback.
- Firebase receive/wake-lock permissions: background push delivery.
- App-specific non-exported receiver permission: Android receiver access protection.

Inspect the final APK, not just the source manifest. Dependency-added permissions must also be removed or justified.

## Submission checklist

1. Build a signed **release APK**, using the existing publisher signing key and a version code higher than the last submitted release. Do not upload the existing debug APK. EAS production currently auto-increments remotely; local Gradle still declares versionCode 1.
2. Inspect the final APK permissions with Android SDK `aapt dump permissions <release.apk>` and confirm the removed permissions are absent.
3. On a physical device, verify wallet connection/signing, optional app lock, opt-in push alerts and notification delivery.
4. Open the publisher URL in a signed-out browser and on mobile data; verify the saved publisher-profile website value.
5. Attach the updated APK and permission explanations to a new submission.

## Suggested reviewer note (after APK verification)

Publisher website: https://www.searixtrade.com/ — a public Searix Trade product page with product information, support contact and legal links; no sign-in required. Please use this exact URL. If access fails, please provide the error and review timestamp so we can investigate.

We removed external-storage, overlay, Wi-Fi multicast discovery boot-completed, launcher badge and Google Play install-referrer permissions. Remaining biometric permissions support the optional app lock. Notifications and related delivery permissions support user-enabled price/premium alerts. Network permissions support market data and transaction services. Please let us know the exact remaining permission if further clarification is needed.

## Local verification

Release manifest merge passed on 24 October 2026 (`:app:processReleaseMainManifest`), including release JavaScript bundling. All 22 blocked permissions are absent from the merged release manifest. Nine permissions remain, corresponding to the explanations above. JSON/XML syntax and `git diff --check` passed. A new signed APK has not been built or submitted, and physical-device checks remain outstanding.
