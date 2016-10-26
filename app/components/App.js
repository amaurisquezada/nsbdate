import React from 'react'
import AppStore from '../stores/AppStore'
import * as AppActions from '../actions/AppActions'


export class App extends React.Component {

  constructor() {
    super()
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      user: AppStore.getUser(),
      available: ''
    }
  }

  componentWillMount() {
    AppStore.on('change', this.handleChange)
  }

  //Temporary for development
  // componentDidMount() {
  //   if (!this.state.user.cuid){
  //     AppActions.currentUser()
  //   }
  // }

  componentWillUnmount() {
    AppStore.removeListener('change', this.handleChange)
  }

  handleChange() {
    this.setState({user: AppStore.getUser()})
  }

  //Temporary function for development

  // receiveUser(name) {
  //   AppActions.currentUser(name)
  // }

  render() {
	  const childrenWithProps = React.Children.map(this.props.children, (child) => React.cloneElement(child, {
   	 	user: this.state.user,
   	 	available: this.state.available
     })
    )

    return (
    	<div className="container main-div">
    		<h1 id="site-header">N<span className="header2">ot</span>S<span className="header2">o</span>B<span className="header2">lind</span>DATE</h1>
        {childrenWithProps}
      </div>
    )
  }
}

export default App;