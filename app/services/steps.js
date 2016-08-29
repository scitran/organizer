'use strict';
const angular = require('angular');

const app = angular.module('app');

function steps($state) {
  const _steps = {};
  return {
    configure: configure,
    complete: complete,
    isComplete: isComplete,
    isActive: isActive,
    next: next,
    current: current,
    back: back,
    go: go,
    hasNext: hasNext,
    hasPrev: hasPrev
  };
  function configure(initialState, steps) {
    $state.go(initialState);
    Object.assign(_steps, steps);
  }
  function current() {
    return $state.current.name;
  }
  function next() {
    const currentState = current();
    if (!_steps[currentState].isComplete) {
      throw 'Can\'t move onto the next step.';
    }
    const nextState = _steps[currentState].next();
    _steps[currentState].nextState = nextState;
    _steps[currentState].isActive = false;
    _steps[nextState].prevState = currentState;
    _steps[nextState].isActive = true;
    $state.go(nextState);
  }
  function hasNext(){
    return !!_steps[current()].next;
  }
  function hasPrev(){
    return !!_steps[current()].prevState;
  }
  function back() {
    const currentState = current();
    const prevState = _steps[currentState].prevState;
    _steps[currentState].isActive = false;
    _steps[currentState].isComplete = false;
    _steps[prevState].isComplete = false;
    _steps[prevState].isActive = true;
    delete _steps[currentState].prevState;
    delete _steps[prevState].nextState;
    $state.go(prevState);
  }
  function isComplete(step) {
    return !!(_steps[step]||{}).isComplete;
  }
  function complete() {
    _steps[current()].isComplete = true;
  }
  function isActive(step) {
    return !!(_steps[step]||{}).isActive;
  }
  function go(step) {
    if (!isComplete(step)) {
      throw 'can\'t go back to a step that hasn\'t been completed';
    }
    let _state = current();
    _steps[_state].isActive = false;
    while (step != _state){
      _steps[_state].isComplete = false;
      let prevState = _steps[_state].prevState;
      delete _steps[_state].prevState;
      _state = prevState;
      delete _steps[prevState].nextState;
    }
    _steps[step].isComplete = false;
    _steps[step].isActive = true;
    $state.go(step);
  }
}
steps.$inject = ['$state'];
app.factory('steps', steps);
