/**
 * 处理Andfleet网站的订单页面
 * @param {Object} pageInfo - 包含页面信息的对象(url等)
 * @returns {void}
 */
function handleAndfleet(pageInfo) {
  window.Utils.waitForDOMStable(3000, 30000)
  .then(function() {
    console.log("DOM稳定");
  })
  .catch(function(error) {
    console.error("DOM稳定失败", error);
  });
}
