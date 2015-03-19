var FlyQueue = function FlyQueue(viewer) {
    FlyQueue.tasks = [];
    var camera = viewer.camera;


    FlyQueue.isRunning = false;

    var isEmpty = function (array) {
        return array.length === 0;
    };

    FlyQueue.setRunning = function (value) {
        this.isRunning = value;
    };

    FlyQueue.getRunning = function () {
        return this.isRunning;
    };

    FlyQueue.rmTasks = function () {
        this.tasks = [];
    };

    FlyQueue.addTask = function (task) {

        this.tasks.push({
            action: function () {
                flyTypes.FlyTo(task);
            },
            id: task.id
        });

        this.tasks.push({
            action: function () {
                flyTypes.Pause(40);
            },
            id: task.id
        });

        this.tasks.push({
            action: function () {
                flyTypes.ZoomingOut(30);
            },
            id: task.id
        });

        if (!FlyQueue.isRunning) {
            FlyQueue.isRunning = true;
            FlyQueue.processQueue();
        }
    };

    var flyTypes = {
        FlyTo: processFlyTo,
//        FlyOut: processFlyOut,
//        Zooming: processZoomIn,
        ZoomingOut: processZoomOut,
        Pause: processPause
    };

    function processZoomOut(amount) {

        var counter = 0;
        var listener = function (clock) {
            if (counter !== amount) {
                viewer.camera.zoomOut(10);
                counter += 1;
            } else {
                viewer.clock.onTick.removeEventListener(listener);
                FlyQueue.processQueue();
            }
        };
        viewer.clock.onTick.addEventListener(listener);
    }

    function processPause(amount) {
        var counter = 0;
        var listener = function (clock) {
            if (counter !== amount) {
                counter += 1;
            } else {
                viewer.clock.onTick.removeEventListener(listener);
                FlyQueue.processQueue();
            }
        };
        viewer.clock.onTick.addEventListener(listener);
    }

    var counterX = 0;

    function processFlyTo(newTask) {
        var cartographic = ellipsoid.cartesianToCartographic(newTask.destination);
        cartographic.height = 500;
        var cartesianNew = new Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);

        camera.flyTo({
            destination: cartesianNew,
            duration: newTask.duration,
            complete: function () {
                FlyQueue.processQueue();
            },
            orientation: {
                pitch: Cesium.Math.toRadians(45.0),
                roll: 0.0
            },
            cancel: function () {
                console.log("smthing went wrong with", bilboard);
            }
        });
    }

    FlyQueue.processQueue = function () {
        if (!FlyQueue.isRunning)
            return;

        if (isEmpty(this.tasks)) {
            FlyQueue.isRunning = false;
            return;
        }

        var newTask = this.tasks.shift();
        if (billboards.get(newTask.id).show == false) {
            billboards.get(newTask.id).show = true;
        }

        counterX += 1;
        newTask.action();
    };


    return FlyQueue;
};