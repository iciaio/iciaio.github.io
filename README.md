# iciaio.github.io

This is two libraries for tracking fingertips. 
Finger Tracking
This lib uses background subtraction and identifies defect and hull points to locate fingertips.

Color Tracking
This lib simply tracks colors and requires users to color their fingertips with something like colored tape or paint.

To use a library, set up a video stream and initiate the library with a context containing the stream. Then in an update function which is called for everyframe you can analyze the image and display fingertip points.
