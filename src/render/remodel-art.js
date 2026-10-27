import {imageFor} from './assets.js';
export function remodelArt(theme,available=id=>!!imageFor(id)){
 const ready=!!theme.exterior&&available(theme.exterior);
 return {key:ready?theme.exterior:'ui/town-node-atelier',decor:ready?null:theme.decor,ready};
}
