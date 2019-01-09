import React, { Component } from 'react'
import Head from 'next/head'
import SuburbLandingPage from '../components/SuburbLandingPage/SuburbLandingPage';
import '../styles/shopify.css';
import '../styles/custom.css';
import 'react-dates/initialize';
import '../styles/react-dates-override.css';
import fetch from 'isomorphic-unfetch';
import ErrorPage from 'next/error';


export default class extends Component {
   static async getInitialProps ({query}) {
     
    const latRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${query.suburb},${query.state},Australia&key=AIzaSyC5FYbQBRtJPiygtIbE7Z5_XEySg5ujwoM`)
    const data1 = await latRes.json()
    let latLng = data1.results[0].geometry.location;
    const geocode = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLng.lat},${latLng.lng}&key=AIzaSyC5FYbQBRtJPiygtIbE7Z5_XEySg5ujwoM`)
    const data2 = await geocode.json()
    let postcode;
    let addressArray = data2.results[0].address_components;
    for(let a of addressArray){
      if(a.types.includes("postal_code")){
          postcode = a.short_name;
      }
    }
    let compare = (a,b) => {
      if (a.num_of_reviews < b.num_of_reviews)
        return 1;
      if (a.num_of_reviews > b.num_of_reviews)
        return -1;
      return 0;
    }

    const stylists = await fetch('https://express-server-ap-southeast-2.flayr.io/p/stylists/'+postcode);
    const data3 = await stylists.json();

    let stylistArray = data3.body;
    stylistArray.sort(compare);
    console.log(stylistArray[0].num_of_reviews)

    let finalSuburb = query.suburb;
    if(finalSuburb.split('-')){
      finalSuburb = finalSuburb.replace('-', ' ');
    }

    let validSuburb = false;
    const suburb = await fetch(`https://express-server-ap-southeast-2.flayr.io/suburbs?state=${query.state.toLowerCase()}&suburb=${finalSuburb.toLowerCase()}`)
    let  suburbData;
    if(suburb.status === 200){
      validSuburb = true;
      suburbData = await suburb.json();
    }


    let meta_title;
    let meta_desc;
    if(suburbData){
      meta_title = suburbData[0].title;
      meta_desc = suburbData[0].desc;
    }
   
    return {meta_desc: meta_desc, meta_title: meta_title, validSuburb: validSuburb, state: query.state, country: query.country, suburb: this.toTitleCase(finalSuburb), stylists: stylistArray.splice(0,10), postcode: postcode}
  }

   static toTitleCase = (str) => {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  render () {
    return (
      <div>
        <Head>
        <title>{this.props.meta_title}</title>
        <meta name="description" content={this.props.meta_desc}></meta>  
        <script type="application/json" dangerouslySetInnerHTML={{__html: `{"@context":"http://schema.org","@type":"BreadcrumbList","itemListElement":[
          {"@type":"ListItem","position":1,"name":"Australia","item":"https://flayr.io/au"},
          {"@type":"ListItem","position":2,"name":"New South Wales","item":"https://flayr.io/au/nsw"},
          {"@type":"ListItem","position":3,"name":"Glebe","item":"https://flayr.io/au/nsw/glebe"},
          {"@type":"ListItem","position":4,"name":"Makeup Artists","item":"https://flayr.io/au/nsw/glebe/makeupartists"}]}`}}></script>
        </Head>
        {this.props.validSuburb &&
          <SuburbLandingPage suburb={this.props.suburb} state={this.props.state} postcode={this.props.postcode} stylists={this.props.stylists}/>
        }
        {!this.props.validSuburb &&
          <ErrorPage statusCode={404}/>

        }
      </div>
    )
  }
}