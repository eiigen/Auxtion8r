function calcIncome(s){return s.inventory.reduce(function(a,id){return (getItem(id)?getItem(id).income:0)+a},0)}
function calcPassive(s){return Math.floor(calcIncome(s)*((Date.now()-s.lastPassive)/60000))}
function addPassive(s){var e=calcPassive(s);s.coins+=e;s.earned+=e;s.lastPassive=Date.now();return{state:s,earned:e}}
function canAfford(s,a){return s.coins>=a}