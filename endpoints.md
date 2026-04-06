<!-- Verified 2026-04-05 against the live IOTAS API. -->

## API Endpoints

Base URL: `https://api.iotashome.com`

| Method | Endpoint                                                            | Request       | Response      | Other                         |
| ------ | ------------------------------------------------------------------- | ------------- | ------------- | ----------------------------- |
| POST   | `api/v1/auth/tokenwithrefresh`                                      | Basic Auth    | jwt + refresh |                               |
| POST   | `api/v1/auth/refresh`                                               | Email + Token | jwt token     |                               |
| POST   | `api/v1/mobile_devices/register`                                    |               |               |                               |
| GET    | `api/v1/account/me`                                                 |               | ✅ Verified   |                               |
| GET    | `api/v1/sosecure/service-available`                                 |               | ⚠️ 500        | `?latitude=0.0&longitude=0.0` |
| GET    | `api/v1/eventtype`                                                  |               | ✅ Verified   |                               |
| GET    | `api/v1/account/{accountId}/residency`                              |               | ✅ Verified   |                               |
| GET    | `api/v1/certificate/mobile`                                         |               | ⚠️ 400        | Requires `device-id` header   |
| GET    | `api/v1/notification/history`                                       |               | ✅ Empty `[]` | `?cnt=0&unitId={unitId}`      |
| GET    | `api/v1/unit/routines/recents`                                      |               | ✅ Empty `[]` | `?unitId={unitId}&days=30`    |
| GET    | `api/v1/assortments`                                                |               | ✅ Verified   |                               |
| GET    | `api/v1/unit/{unitId}`                                              |               | ✅ Verified   |                               |
| GET    | `api/v1/unit/{unitId}/scenes`                                       |               | ✅ Verified   |                               |
| GET    | `api/v1/building/{buildingId}`                                      |               | ✅ Verified   |                               |
| GET    | `api/v1/unit/{unitId}/routines`                                     |               | ✅ Empty `[]` |                               |
| GET    | `api/v1/amenities/resident/{residentId}/reservation`                |               | Not tested    |                               |
| GET    | `api/v1/unit/{unitId}/guests`                                       |               | ✅ Empty `[]` |                               |
| GET    | `api/v1/unit/{unitId}/rooms`                                        |               | ✅ Verified   |                               |
| GET    | `api/v1/unit/{unitId}/access_options`                               |               | ✅ Verified   |                               |
| GET    | `api/v1/building/{buildingId}/configuration`                        |               | ✅ Verified   |                               |
| POST   | `api/v1/scene`                                                      |               |               | Create scene                  |
| POST   | `api/v1/feature_action`                                             |               |               | Create feature action         |
| POST   | `api/v1/scene/{sceneId}/set`                                        |               |               | Activate scene                |
| GET    | `api/v1/access_management/door_codes/device/{deviceId}/details`     |               | ✅ Verified   |                               |
| GET    | `api/v1/access_management/door_codes/resident/{residentId}/details` |               | ✅ Verified   |                               |
| PUT    | `api/v1/feature/{featureId}/value`                                  |               |               |                               |

Assets: `https://iotas-resident-app-assets.s3-us-west-2.amazonaws.com`

---

#### AUTH TOKENWITHREFRESH Response

```json
{
  "jwt": "{jwt: String}",
  "refresh": "{refreshToken: String}"
}
```

#### AUTH REFRESH Request

```json
{
  "refresh": "{refreshToken: String}",
  "email": "{email: String}"
}
```

#### AUTH REFRESH Response

```json
{
  "jwt": "{jwt: String}"
}
```

---

#### ACCOUNT ME Response ✅

```json
{
  "id": "{accountId: Int}",
  "email": "{email: String}",
  "hasPassword": "{Boolean}",
  "passwordSetAt": "{date: String: YYYY-MM-DDTHH:MM:SS}",
  "passwordFirstSetAt": "{date: String: YYYY-MM-DDTHH:MM:SS}",
  "firstName": "{String}",
  "lastName": "{String}",
  "phoneNumber": "{String}",
  "createdAt": "{date: String: YYYY-MM-DDTHH:MM:SS}",
  "keepConnected": "{Boolean}",
  "shareData": "{Boolean}",
  "accessibilityColor": "{Boolean}",
  "onboardingComplete": "{Boolean}",
  "soSecureRegistered": "{Boolean}",
  "phoneNumberVerified": "{Boolean}",
  "isAdmin": "{Boolean}",
  "isSuperAdmin": "{Boolean}",
  "mfaEnabled": "{Boolean}",
  "mfaPopup": "{Boolean}",
  "showPairingInstructions": "{Boolean}"
}
```

#### RESIDENCY Response ✅

> ⚠️ Note: The unit ID field is `unit` (not `unitId`). The `id` field is a **String**, not an Int.

```json
[
  {
    "id": "{residencyId: String}",
    "accountId": "{accountId: Int}",
    "unit": "{unitId: Int}",
    "buildingId": "{buildingId: Int}",
    "unitName": "{unitCode: String}",
    "dateFrom": "{date: String: YYYY-MM-DDTHH:MM:SS}",
    "tenant": "{Boolean}",
    "unitAdmin": "{Boolean}",
    "email": "{email: String}",
    "firstName": "{String}",
    "lastName": "{String}",
    "phoneNumber": "{String}",
    "createdAt": "{date: String: YYYY-MM-DDTHH:MM:SS}",
    "suspended": "{Boolean}",
    "account": {
      "id": "{accountId: Int}",
      "email": "{email: String}",
      "firstName": "{String}",
      "lastName": "{String}",
      "phoneNumber": "{String}",
      "hasPassword": "{Boolean}"
    }
  }
]
```

#### EVENTTYPE Response ✅

```json
[
  { "id": 1, "name": "OnOff", "units": "Binary", "minValue": 0, "maxValue": 1 },
  { "id": 2, "name": "Power", "units": "Amps", "minValue": 0, "maxValue": 100 },
  { "id": 3, "name": "Level", "units": "Proportion", "minValue": 0, "maxValue": 1 },
  { "id": 4, "name": "ThermostatMode", "units": "Enumeration", "minValue": 0, "maxValue": 5 },
  { "id": 5, "name": "FanMode", "units": "Enumeration", "minValue": 0, "maxValue": 4 },
  { "id": 6, "name": "Temperature", "units": "DegreesFahrenheit", "minValue": -20, "maxValue": 120 },
  { "id": 7, "name": "List", "units": "Enumeration", "minValue": 0, "maxValue": 25 },
  { "id": 11, "name": "Time", "units": "Enumeration", "minValue": 0, "maxValue": 86400 },
  { "id": 12, "name": "PinCode", "units": "PinCode", "minValue": 0, "maxValue": 999999 },
  { "id": 13, "name": "CodeCount", "units": "CodeCount", "minValue": 0, "maxValue": 250 }
]
```

---

#### UNIT Response ✅

```json
{
  "id": "{unitId: Int}",
  "building": "{buildingId: Int}",
  "unitTemplate": {
    "id": "{Int}",
    "facilityDescription": "{Int}",
    "buildingId": "{buildingId: Int}",
    "name": "{String}",
    "roomCount": "{Int}",
    "deviceCount": "{Int}",
    "unitCount": "{Int}"
  },
  "name": "{unitName: String}",
  "model": "{Boolean}",
  "common": "{Boolean}",
  "flipped": "{Boolean}",
  "hubs": [
    {
      "id": "{hubId: Int}",
      "serialNumber": "{String}",
      "hardware": "{String}",
      "group": "{String}",
      "ipAddress": "{String | null}",
      "monitorEnergy": "{Boolean}",
      "lastAlive": "{date: String: YYYY-MM-DDTHH:MM:SS}",
      "otaVersion": "{version: String: X.X.X}",
      "iotasEngineVersion": "{version: String: X.X.X-X}",
      "activeConnection": "{String}",
      "connectionType": "{String}",
      "uptime": "{Int}",
      "diskUsage": "{Float}",
      "unit": "{unitId: Int}",
      "lastSeen": "{timestamp: Int}",
      "mappedCount": "{Int}",
      "unmappedCount": "{Int}",
      "pairedCount": "{Int}",
      "paired": "{Boolean}",
      "online": "{Boolean}",
      "certExpirationDate": "{Int | null}",
      "macAddress": "{String}",
      "deviceName": "{String}"
    }
  ],
  "provisionedStatus": "{String: Provisioned | Provisioning Incomplete}",
  "tenantCount": "{Int}",
  "nonTenantCount": "{Int}",
  "editedRoutines": "{Boolean}",
  "deviceCount": "{Int}",
  "provisionedAt": "{date: String: YYYY-MM-DDTHH:MM:SS}",
  "floorName": "{String}",
  "lockType": "{String}",
  "rooms": ["See ROOMS Response"]
}
```

> ⚠️ Note: When rooms are nested inside the `/unit/{unitId}` response, device `physicalDeviceDescription`
> is returned as an **Int** (ID reference). When fetched via `/unit/{unitId}/rooms`, it is a full **Object**.

#### ROOMS Response ✅

```json
[
  {
    "id": "{roomId: Int}",
    "unit": "{unitId: Int}",
    "roomTemplate": {
      "id": "{Int}",
      "unitTemplateId": "{Int}",
      "name": "{String}",
      "isPrivate": "{Boolean}"
    },
    "name": "{roomName: String}",
    "devices": ["See DEVICE Response"]
  }
]
```

#### DEVICE Response ✅

> Devices are nested within rooms. Shape varies based on `paired` status.

```json
{
  "id": "{deviceId: Int}",
  "room": "{roomId: Int}",
  "roomName": "{String}",
  "deviceTemplateId": "{Int}",
  "deviceType": "{Int}",
  "triggerTags": [],
  "name": "{String}",
  "category": "{String: lock | dimmer | switch | motion_switch | thermostat | door}",
  "icon": "{String}",
  "paired": "{Boolean}",
  "secure": "{Boolean}",
  "active": "{Boolean}",
  "movable": "{Boolean}",
  "serialNumber": "{String}",
  "features": ["See FEATURE Response"],
  "physicalDevice": "{Int | absent}",
  "physicalDeviceDescription": "{Object | absent}"
}
```

`physicalDeviceDescription` (present when `paired: true`, via `/rooms` endpoint):

```json
{
  "id": "{Int}",
  "name": "{String}",
  "manufacturer": "{String}",
  "model": "{String}",
  "secure": "{Boolean}",
  "movable": "{Boolean}",
  "external": "{Boolean}",
  "protocol": "{String: zwave | ...}",
  "deviceSpecificKey": "{Boolean}",
  "isActive": "{Boolean}"
}
```

Known device categories: `lock`, `dimmer`, `switch`, `motion_switch`, `thermostat`, `door`

#### FEATURE Response ✅

> Features are nested within devices. Shape varies based on whether the parent device is `paired`.

**Base fields (always present):**

```json
{
  "id": "{featureId: Int}",
  "device": "{deviceId: Int}",
  "featureType": "{Int}",
  "featureTypeName": "{String}",
  "featureTypeCategory": "{String}",
  "name": "{String}",
  "isLight": "{Boolean}"
}
```

**Additional fields (present when device is paired):**

```json
{
  "eventType": "{Int}",
  "eventTypeName": "{String}",
  "physical": "{Int}",
  "physicalFeatureDescription": "{Int}",
  "featureTypeSettable": "{Boolean}",
  "value": "{Number | absent}",
  "values": "{String | absent}"
}
```

**Optional fields:**

```json
{
  "uiStoredValue": "{Number | absent}"
}
```

The `values` field is a colon-delimited enum label string, e.g. `"Off:Heat:Cool:Heat Econ:Cool Econ"`.

Known feature type categories:

| Category              | Event Type     | Settable | Notes                                       |
| --------------------- | -------------- | -------- | ------------------------------------------- |
| `lock`                | OnOff          | Yes      | 0=unlocked, 1=locked                        |
| `light`               | —              | —        | Unpaired template feature                   |
| `battery`             | Level          | No       | 0–100 percentage                            |
| `thermostat_mode`     | ThermostatMode | Yes      | Values: "Off:Heat:Cool:Heat Econ:Cool Econ" |
| `current_temperature` | Temperature    | No       | Degrees Fahrenheit                          |
| `heat_set_point`      | Temperature    | Yes      | Degrees Fahrenheit                          |
| `cool_set_point`      | Temperature    | Yes      | Degrees Fahrenheit                          |
| `fan_mode`            | FanMode        | Yes      | Values: "Auto Low:On Low:Circulate"         |
| `humidity`            | Level          | No       | 0–100 percentage                            |
| `motion`              | OnOff          | No       |                                             |
| `motion_reset`        | —              | —        | Unpaired template feature                   |
| `operation_mode`      | —              | —        | Unpaired template feature                   |
| `door_lock_state`     | List           | No       |                                             |
| `door_state`          | —              | —        | Unpaired template feature                   |
| `door_codes_deleted`  | OnOff          | No       | Values: colon-delimited event labels        |
| `auto_relock`         | OnOff          | Yes      | Values: "Off:On"                            |
| `auto_relock_timeout` | Level          | Yes      | Seconds                                     |

---

#### SCENES Response ✅

```json
[
  {
    "id": "{sceneId: Int}",
    "unit": "{unitId: Int}",
    "name": "{String}",
    "backgroundPhoto": "{String}",
    "featureActions": [
      {
        "id": "{featureActionId: Int}",
        "scene": "{sceneId: Int}",
        "feature": "{featureId: Int}",
        "featureTypeCategory": "{String}",
        "value": "{Float}",
        "device": "{deviceId: Int}",
        "room": "{roomId: Int}"
      }
    ],
    "featureTypeActions": [],
    "unitRoutines": []
  }
]
```

#### SCENE Request (POST)

```json
{
  "backgroundPhoto": "scene_photo_01",
  "name": "Scene Name",
  "unit": "{unitId: Int}"
}
```

#### FEATURE ACTION Request (POST)

```json
{
  "feature": "{featureId: Int}",
  "scene": "{sceneId: Int}",
  "value": "{value: Float}"
}
```

#### FEATURE ACTION Response

```json
{
  "id": "{featureActionId: Int}",
  "scene": "{sceneId: Int}",
  "feature": "{featureId: Int}",
  "featureTypeCategory": "{String}",
  "value": "{Float}",
  "device": "{deviceId: Int}",
  "room": "{roomId: Int}"
}
```

#### FEATURE VALUE Request (PUT)

```json
{
  "value": "{value: Float}"
}
```

---

#### BUILDING Response ✅

```json
{
  "id": "{buildingId: Int}",
  "facilityDescription": "{Int}",
  "managerFirstName": "{String}",
  "managerLastName": "{String}",
  "phone": "{String}",
  "email": "{email: String}",
  "address": "{String}",
  "city": "{String}",
  "state": "{String: 2-letter}",
  "country": "{String: 2-letter}",
  "zipCode": "{String}",
  "timezoneName": "{String: IANA timezone, e.g. America/Los_Angeles}",
  "facilityName": "{String}",
  "name": "{String}",
  "unitCount": "{Int}",
  "salesForceId": "{String}",
  "status": "{String: LIVE | ...}",
  "temperatureUnits": "{String: F | C}",
  "appContextId": "{Int}",
  "platformId": "{Int}",
  "vacantConnectivity": "{String}",
  "occupiedConnectivity": "{String}",
  "commonAreaConnectivity": "{String}",
  "reportUrl": "{String}"
}
```

#### CONFIGURATION Response ✅

```json
{
  "id": "{Int}",
  "buildingId": "{buildingId: Int}",
  "packageManagement": "{Boolean}",
  "dataInsights": "{Boolean}",
  "maintenanceTickets": "{Boolean}",
  "prospectTour": "{Boolean}",
  "guestAccess": "{Boolean}",
  "alexaForResidential": "{Boolean}",
  "butterflyMxVisitorCalling": "{Boolean}",
  "soSecure": "{Boolean}",
  "reservations": "{Boolean}",
  "mfAuth": "{Boolean}",
  "occupiedDeviceControl": "{Boolean}",
  "suites": "{Boolean}",
  "pinCodeType": "{String: unit | ...}"
}
```

---

#### ACCESS OPTIONS Response ✅

```json
[
  {
    "id": "{Int}",
    "name": "{String}",
    "description": "{String}",
    "buildingId": "{buildingId: Int}",
    "model": "{Boolean}",
    "common": "{Boolean}",
    "vacant": "{Boolean}",
    "occupied": "{Boolean}",
    "isBuildingOption": "{Boolean}",
    "sortPriority": "{Int}",
    "type": "{String: CUSTOM | BUTTERFLYMX | UNIT_DOOR}"
  }
]
```

#### ASSORTMENTS Response ✅

> ⚠️ Note: All ID fields (`id`, `accountId`, `parentId`, `sortedIds` entries) are **Strings**, not Ints.

```json
[
  {
    "id": "{String}",
    "accountId": "{String}",
    "entityType": "{String: favorite_device | favorite_scene | room | routine | scene}",
    "parentId": "{String}",
    "parentType": "{String: unit | room}",
    "sortedIds": ["{String}", "..."],
    "children": "{Array | null}"
  }
]
```

`children` (when present, e.g. for `entityType: "room"`):

```json
[
  {
    "accountId": "{String}",
    "entityType": "{String: device}",
    "parentId": "{String}",
    "parentType": "{String: room}",
    "sortedIds": ["{String}", "..."]
  }
]
```

---

#### RESIDENT DOOR CODE Response ✅

```json
[
  {
    "isOnline": "{Boolean}",
    "deviceId": "{deviceId: Int}",
    "deviceName": "{String}",
    "roomName": "{String}",
    "hardware": "{String}",
    "isCodeSet": "{Boolean}",
    "batteryLevel": "{Int}",
    "type": "RESIDENT",
    "residentId": "{residentId: Int}",
    "firstName": "{String}",
    "lastName": "{String}"
  }
]
```

#### DEVICE DOOR CODE Response ✅

> ⚠️ Note: `pinCode` is only present when `isCodeSet: true`.

```json
[
  {
    "id": "{Int}",
    "deviceId": "{deviceId: Int}",
    "unitId": "{unitId: Int}",
    "roomName": "{String}",
    "isCodeSet": "{Boolean}",
    "type": "UNIT",
    "pinCode": "{Int | absent}"
  }
]
```

---

#### MOBILE DEVICE REGISTER Request (POST)

```json
{
  "flavor": "IOTAS",
  "mobileDeviceId": "{String}",
  "platform": "{String}"
}
```

#### Endpoints Not Verified

| Endpoint                                   | Reason                                    |
| ------------------------------------------ | ----------------------------------------- |
| `GET /sosecure/service-available`          | Returns 500 (upstream auth issue)         |
| `GET /certificate/mobile`                  | Returns 400 (requires `device-id` header) |
| `GET /amenities/resident/{id}/reservation` | Not tested                                |
| `GET /notification/history`                | Returns empty `[]` — schema unknown       |
| `GET /unit/routines/recents`               | Returns empty `[]` — schema unknown       |
| `GET /unit/{unitId}/routines`              | Returns empty `[]` — schema unknown       |
| `GET /unit/{unitId}/guests`                | Returns empty `[]` — schema unknown       |
