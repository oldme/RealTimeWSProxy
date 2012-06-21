
var array = new Array();
array.push('a');
array.push('b');
array.push('c');
array.push('d');
array["john"] = "smith"

console.log(array);

delete array['john'];
delete array['mark'];
console.log(array);