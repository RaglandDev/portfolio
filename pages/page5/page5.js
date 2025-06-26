export function initPage5() {
  const buttons = document.querySelectorAll(".project-btn");
  const items = document.querySelectorAll(".project-item");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const id = btn.dataset.id;
      console.log(id);
      items.forEach((item) => {
        item.classList.toggle("active", item.dataset.id === id);
      });
    });
  });
}
