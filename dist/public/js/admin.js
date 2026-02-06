const deleteProduct = async (btn) => {
  const productId = btn.parentNode.querySelector("[name=productId]").value;
  const csrfToken = btn.parentNode.querySelector("[name=_csrf]").value;

  const productElement = btn.closest("article");

  const res = await fetch(`/admin/product/${productId}`, {
    method: "DELETE",
    headers: {
      "csrf-token": csrfToken,
    },
  });

  if (res.status === 200) {
    productElement.parentNode.removeChild(productElement);
  } else {
    console.log(res);
  }
};
