# Detector

## Current detector

* **Name**: az_v20
* **Released**: 20. Aug 2019

## Changes
* Significantly better at correctly detecting all labels.
* More specialized towards use case. Only outputs person, head and chair label.
* Slightly higher probability of detecting relfections.

## Limitations
The detector is optimized to the cameras primary use case, and is therefore trained specifically towards small to medium sized conference rooms.
This means that it is particulary good a detections up to approximately 5 meters, but less reliable outside of this range.

## Output

#### Labels
Current labels the detector will output data for.

* **Person**
* **Head**
* **Chair**

#### Sample output
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
            "label": "chair",
            "confidence": 0.3582177758216858,
            "bbox": {
                "x": 94,
                "y": 162,
                "width": 340,
                "height": 212
            }
        }
    ]
}
```

## REST Api references
* [Start autozoom (genius framing) and detector](rest-api/detector-start.html) : `PUT /detector/start`
* [Stop autozoom (genius framing) and detector](rest-api/detector-stop.html) : `PUT /detector/stop`
* [Get detections](rest-api/get-detections.html) : `GET /detector/detections`
