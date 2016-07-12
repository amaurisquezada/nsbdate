import React, { PropTypes as T } from 'react'
import { Button } from 'react-bootstrap'
import * as AppActions from '../actions/AppActions'

export class Login extends React.Component {

  constructor() {
    super()
  }

  render() {
    return (
    	<div id="login-page">
        <div id="login-container">
          <h2>Welcome to NSB Date</h2>
          <p>Real-time dating app for the modern skeptic</p>
          <a href="http://localhost:3000/login/facebook" className='btn btn-primary'>Sign-in/Sign up with Facebook</a>
        </div>
       </div>
    )
  }
}

export default Login;