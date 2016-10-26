import React from 'react'

export class Login extends React.Component {

  constructor() {
    super()
  }

  render() {
    return (
    	<div id="login-page">
        <div id="login-container">
          <h2 className="welcome">Welcome to NSB Date</h2>
          <p className="welcome-caption">Real-time dating app for the modern skeptic</p>
          <a href="http://nsbdate.com:3000/login/facebook" className='btn btn-primary'>Sign-in/Sign up with Facebook</a>
        </div>
      </div>
    )
  }
}

export default Login;