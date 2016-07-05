'use strict';
const App = require('./components/App');
const React = require('react');
const ReactDOM = require('react-dom');
const { Router, Route, hashHistory} =  require('react-router');

ReactDOM.render((
  <Router history={hashHistory}>
    <Route path="/" component={App}>
    </Route>
  </Router>),
  document.getElementsByClassName('window-content')[0]);
