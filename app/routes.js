import React from 'react';
import {Route, IndexRedirect} from 'react-router';
import App from './components/App';
import Login from './components/Login';
import User from './components/User';
import NewUser from './components/NewUser';
import Chat from './components/Chat';
import AppStore from './stores/AppStore'



// function requireAuth(nextState, replace) {
// 	const currentUser = AppStore.getUser()
//   if (currentUser.cuid === undefined) {
//     replace({
//       pathname: '/login',
//       state: { nextPathname: nextState.location.pathname }
//     })
//   }
// }

export default (
  <Route component={App}>
  	<Route path='/login' component={Login} />
    <Route path='/newuser' component={NewUser} />
    <Route path='/mychats' component={Chat} />
    <Route path='/' component={User} />
  </Route>
);

