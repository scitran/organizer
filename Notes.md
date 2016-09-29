# Electron app basics

There are two important files in an Electron app:
- the main (usually called main.js)
- the renderer (usually renderer.js)

The first one manages the app lifecycle (starting it, loading the index.html file, closing the app), plus operations like opening a new window, accessing a folder from a finder pop-up, etc.
The second one is the core of the app and should be included in the index.html like you would do for a standard javascript file.

The difference between the renderer and a js file in a web page is that the renderer can load any node module, has access to the filesystem and can communicate with the main process to open pop-ups to select folders and files.


# App structure

The entry point of the app is the file "renderer.js".
The angular bootstrap is triggered in the line:
```
document.addEventListener('DOMContentLoaded', boot);
```
There is a global storage used to store the state of the app (loaded dicoms, selected data size, operations progress, success or failure messages).
There is a service called "steps" that keeps track of the current step, which steps has been completed, what is the next step. It is configured at startup.
Other services are:
- "dicoms" to load, sort and parse an unorganized folder of files.
- "fileSystemQueues" to execute file system operations like read, write in a controlled fashion.
- "apiQueues" a queue system to send API operations.
- "projectsService" to save the organized dicoms on the file system (using "fileSystemQueues").
- "organizeUpload" to upload files to the API (using apiQueues).

The app is divided in the following views:
- load
- organize
- save
- upload

Each of these views has its own controller.

## load view

## organize view

## save view

## upload view


# Rxjs basics

The most important concept to understand is the one of "observable" which is an object emitting messages in a predictable but asynchronous sequence.
It helps in controlling async list of events: a typical example could be user click events.

```
var input = $('#input');

var source = Rx.Observable.fromEvent(input, 'click');

var subscription = source.subscribe(
  function (x) {
    console.log('Next: Clicked!');
  },
  function (err) {
    console.log('Error: %s', err);
  },
  function () {
    console.log('Completed');
  });

input.trigger('click');
// => Next: Clicked!
```

Observables can be created in a lot of ways, for example in the organizer, in app/common/util.js, the method dirListObs creates an observable emitting the list of all the files and subfolders in a folder. It's generated in a recursive fashion (don't worry about all the details just check what is returned):
- `Rx.Observable.of(path)` is an observable with only one element, the input path.
- we apply the method expand that applies the method _helperObs recursively starting from the input path.

After an observable is created, it's possible to subscribe to it, passing three functions as arguments:
- a method that will be executed each time an element is emitted by the observable
- a method for each error
- a method executed when the observable has completed

Another useful observable that was used in the Organizer is the rx.Subject. It is an observable with this API:
- the method "onNext" will emit a value (the one passed to the method)
- "onError" will emit an error
- "onCompleted" will tell that the list of events is complete for this subject.
It's very useful to manipulate observables.
This is a complete example that will log a click every two clicks:
```
var input = $('#input');

var source = Rx.Observable.fromEvent(input, 'click');

var subj = Rx.Subject()
var count = false;

var subscription = source.subscribe(
  function (x) {
    if (count) {
      subj.onNext(x);
    }
    count = !count;
  },
  function (err) {
    subj.onError(err);
  },
  function () {
    subj.onCompleted();
  });

subj.subscribe(
  function (x) {
    console.log('Next: Clicked!');
  },
  function (err) {
    console.log('Error: %s', err);
  },
  function () {
    console.log('Completed');
  });

input.trigger('click');
// nothing logged
input.trigger('click');
// => Next: Clicked!
```

This cleanly separates what is selected of the original observable from what is executed on the resulting observable giving composability and flexibility.

These are the basic elements used of Rxjs in the Organizer. A good tutorial is http://reactivex.io/learnrx/


