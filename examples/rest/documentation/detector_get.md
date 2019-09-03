# Get detections

Queries for the last detections that have come in.

**URL** : `/detector/detections`

**Method** : `GET`

## Success Response

**Code** : `200 OK`

**Content examples**

```json
{
    "detections": [
        {
            "id": 0,
            "label": "person",
            "confidence": 0.40885019302368164,
            "bbox": {
                "x": 7,
                "y": 77,
                "width": 218,
                "height": 136
            }
        },
        {
            "id": 1,
            "label": "diningtable",
            "confidence": 0.3582177758216858,
            "bbox": {
                "x": 94,
                "y": 162,
                "width": 340,
                "height": 212
            }
        }
    ],
    "framing": {
        "bbox": {
            "x": 0,
            "y": 0,
            "width": 544,
            "height": 360
        },
        "shouldptz": false
    }
}
```
