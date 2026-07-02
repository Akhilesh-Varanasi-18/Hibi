function compareStrings(str1, str2) {
  const clean = (s) => s?.replace(/[^a-zA-Z]/g, "").toLowerCase();
  return clean(str1) === clean(str2);
}
function NotEqual(str1, str2) {
  const clean = (s) => s?.replace(/[^a-zA-Z]/g, "").toLowerCase();
  return clean(str1) != clean(str2);
}
const Comparing = {
  compareStrings,
  NotEqual
}
export default Comparing;