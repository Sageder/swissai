import { Place } from "./structs";

export const placeToThumbnail = (place: Place) => {
  // Top-down view with bearing: 0, pitch: 0, using satellite-streets style for better aerial view
  return `https://api.mapbox.com/styles/v1/x123654/clx3ekln001sh01ny4p0540rv/static/${place.lng},${place.lat},10,0,0/300x200@2x?access_token=pk.eyJ1IjoieDEyMzY1NCIsImEiOiJjbDRlZHFmd3kwMG52M2pwNmw4cHF2emp0In0.t0FgxuwjL0el5ovdjZMxmg`;
};

//Actual url:
//https://api.mapbox.com/styles/v1/x123654/clx3ekln001sh01ny4p0540rv.html?title=copy&access_token=pk.eyJ1IjoieDEyMzY1NCIsImEiOiJjbDRlZHFmd3kwMG52M2pwNmw4cHF2emp0In0.t0FgxuwjL0el5ovdjZMxmg&zoomwheel=true&fresh=true#11.41/51.2103/6.8536