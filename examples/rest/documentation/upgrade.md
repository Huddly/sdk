# POST upgrade

POST upgrade camera with provided file

**URL** : `/upgrade`

**Method** : `POST`

## Success Response

**Code** : `200 OK`

```
curl \
  -F "file=@/path/iq-sw-1.x.hpk" \
  localhost:8080/upgrade
```

**Content examples**

```json
{
  "message": "Upgrading in progress",
  "links": {
    "progress": {
      "url": "upgrade/status"
    }
  }
}
```
