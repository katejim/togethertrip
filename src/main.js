/**
 * Created by kate on 06.03.15.
 */
var viewer = new Cesium.Viewer('cesiumContainer', {
    timeline: false,
    fullscreenButton: false,
    infoBox: false,
    animation: false,
    homeButton: false,
    geocoder: true,
    sceneModePicker: true, // отвечает за вид сцены (3D, 2D ...)
    baseLayerPicker: false,
    navigationHelpButton: false
});

var toDecimal = function (number) {
    if (Cesium.defined(number))
        return number[0].numerator + number[1].numerator /
            (60 * number[1].denominator) + number[2].numerator / (3600 * number[2].denominator);
    return undefined;
};

var billboards = new Cesium.BillboardCollection();
viewer.scene.primitives.add(billboards);

var filesCount;
var flyQueue = new FlyQueue(viewer);
var ellipsoid = viewer.scene.globe.ellipsoid;

var windowWidth = $(document).width();
var windowHeight = $(document).height();


$("#loadButton").change(function (evt) {
    var files = evt.target.files; // FileList object
    var lat = 0;
    var lon = 0;
    var width = 0;
    var height = 0;
    var scale = 1;
//

    filesCount = files.length;
    for (var i = 0, f; f = files[i]; i++) {

        if (!f.type.match('image.*')) {
            filesCount -= 1;
            continue;
        }

        var reader = new FileReader();
        reader.onload = (function (theFile) {
            EXIF.getData(theFile, function () {
                lon = toDecimal(EXIF.getTag(this, 'GPSLongitude'));
                lat = toDecimal(EXIF.getTag(this, 'GPSLatitude'));
                width = EXIF.getTag(this, 'PixelXDimension');
                height = EXIF.getTag(this, 'PixelYDimension');


                if (width < height)
                    scale = windowWidth / (5 * width);
                else
                    scale = windowHeight / (3 * height);

                console.log(EXIF.getTag(this, 'GPSLongitude'), lat);
                filesCount -= 1;
            });
            return function (e) {
                if (Cesium.defined(lat) && Cesium.defined(lon)) {
                    billboards.add({
                        show: false,
                        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0.0),
                        eyeOffset: new Cesium.Cartesian3(0.0, 0.0, filesCount), // default
                        image: e.target.result,
                        scaleByDistance: new Cesium.NearFarScalar(500, scale, 1.0e5, 0)
                    });
                } else {
                    writeMeg();
                }

            };
        })(f);

        reader.onloadend = end;
        reader.readAsDataURL(f);
    }


});

function end() {
    var currentBilboardID = billboards.length - 1;
    if (currentBilboardID > -1) {
        flyQueue.addTask({
            destination: billboards.get(currentBilboardID).position,
            duration: 4.0,
            id: currentBilboardID
        });
    }
}

var writeMeg = function () {
    $("#msg").append(
        $('<p>')
            .text("no geo data find in image")
    );
}

$("#start").click(function () {
    flyQueue.isRunning = true;
    flyQueue.processQueue();
});

$("#pause").click(function () {
    flyQueue.isRunning = false;
});

$("#stop").click(function () {
    alert("stop");
    flyQueue.rmTasks();
});
