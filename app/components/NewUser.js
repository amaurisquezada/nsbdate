import React from 'react'
import { FormGroup, FormControl, ControlLabel } from 'react-bootstrap'
import * as NewUserActions from '../actions/NewUserActions'
import { Link } from 'react-router'

export default class NewUser extends React.Component{
  constructor() {
  	super()
  	this.getValidationState = this.getValidationState.bind(this)
  	this.handleChange = this.handleChange.bind(this)
  	this.setGender = this.setGender.bind(this)
  	this.submit = this.submit.bind(this)
    this.state = {
      value: '',
      age: 0,
      gender: 'Male'
    }
  }

  getValidationState() {
    const input = parseInt(this.state.value)
    if (typeof(input) === 'number') return 'success';
    else if (typeof(input) !== 'number') return 'error';
  }

  handleChange(e) {
    this.setState({ age: parseInt(e.target.value)});
  }

  setGender(e){
  	this.setState({gender: e.target.value})
  }

  submit() {
  	NewUserActions.updateNewUser(this.state)
  }

  render() {
    return (
    	<div>
      	<h2>Almost there!</h2>
      	<p>Just need a bit more info</p>
        <form>
          <FormGroup controlId="formBasicText" validationState={this.getValidationState()}>
            <ControlLabel>Age</ControlLabel>
            <FormControl type="text" label="Age" value={this.state.age === 0 ? '' : this.state.age} placeholder="Enter age" onChange={this.handleChange}/>
            <FormControl.Feedback />
          </FormGroup>
     			<FormGroup controlId="formControlsSelect">
			      <ControlLabel>I am a ...</ControlLabel>
			      <FormControl componentClass="select" placeholder="Gender" onChange={this.setGender}>
			        <option value="Male">Man</option>
			        <option value="Female">Woman</option>
			      </FormControl>
			    </FormGroup>
			    <FormGroup controlId="formControlsSelect">
			      <ControlLabel>I am interested in ...</ControlLabel>
			      <FormControl componentClass="select" placeholder="Preference">
			        <option value="Men">Men</option>
			        <option value="Women">Women</option>
			      </FormControl>
			    </FormGroup>
			    <Link to='/' className="btn btn-default" onClick={this.submit}>Submit</Link>
        </form>
      </div>
    )
  }
}