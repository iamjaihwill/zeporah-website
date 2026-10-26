document.documentElement.classList.add("js");

// Sticky nav border + mobile menu
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav__toggle");
addEventListener("scroll", () => nav.classList.toggle("is-scrolled", scrollY > 8), { passive: true });
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

// Reveal on scroll: anything whose top is above the bottom 8% of the viewport fades in once
let pending = [...document.querySelectorAll(".reveal")];
let queued = false;
function reveal() {
  queued = false;
  const line = innerHeight * 0.92;
  pending = pending.filter((el) => el.getBoundingClientRect().top < line ? (el.classList.add("is-in"), false) : true);
}
addEventListener("scroll", () => !queued && (queued = true) && requestAnimationFrame(reveal), { passive: true });
addEventListener("resize", reveal);
reveal();

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Hero "trusted picture": the waiting row quietly moves between held and approved
const cycleRow = document.querySelector("[data-cycle]");
if (cycleRow && !calm) {
  const chip = cycleRow.querySelector("[data-cycle-chip]");
  const audit = document.querySelector("[data-cycle-audit]");
  const states = [
    { chip: "Held · consent review", cls: "chip chip--brass", audit: "Last change 9:12 AM · Dana R., care guide · logged" },
    { chip: "Approved · 14 days", cls: "chip chip--moss", audit: "Last change 10:42 AM · M. Ortiz, reviewer · logged" },
  ];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % states.length;
    chip.className = states[i].cls;
    chip.textContent = states[i].chip;
    audit.textContent = states[i].audit;
  }, 4200);
}

// Workflow stepper: family view and care-team view move together
document.querySelectorAll("[data-flow]").forEach((flow) => {
  const buttons = [...flow.querySelectorAll("[data-go]")];
  const caption = flow.querySelector(".flow__caption");
  const prev = flow.querySelector("[data-prev]");
  const next = flow.querySelector("[data-next]");
  let current = 0;
  function show(step) {
    current = step;
    buttons.forEach((b, i) => {
      b.toggleAttribute("aria-current", i === step);
      if (i === step) b.setAttribute("aria-current", "step");
      b.classList.toggle("is-past", i < step);
    });
    flow.querySelectorAll(".flow__state").forEach((s) => (s.hidden = Number(s.dataset.step) !== step));
    caption.textContent = `Step ${step + 1} of ${buttons.length} · ${buttons[step].textContent.replace(/^\d/, "")}`;
    prev.disabled = step === 0;
    flow.querySelector(".flow__progress span").style.width = `${((step + 1) / buttons.length) * 100}%`;
    next.textContent = step === buttons.length - 1 ? "Start over" : "Next step";
  }
  buttons.forEach((b, i) => b.addEventListener("click", () => show(i)));
  prev.addEventListener("click", () => show(Math.max(0, current - 1)));
  next.addEventListener("click", () => show(current === buttons.length - 1 ? 0 : current + 1));
  show(0);
});

// Demo request form
const form = document.getElementById("demo-form");
if (form) {
  const done = document.getElementById("demo-form-done");
  const status = form.querySelector(".interest__status");
  const submit = form.querySelector(".interest__submit");
  const messages = {
    name: "Please enter your name.",
    email: "Please enter a valid work email.",
    organization: "Please enter your organization.",
    role: "Please choose your role.",
    state: "Please enter your state.",
  };

  // ?for=family or ?for=security turns the demo form into a suggestion or documentation request
  const variants = {
    family: { org: "Hospice or care provider", email: "Email", role: "Family member or caregiver", submit: "Send suggestion", done: "We'll reach out to your care team about Zeporah." },
    security: { org: "Organization", email: "Work email", role: "", submit: "Request documentation", done: "We'll email you our security documentation shortly." },
  };
  const kind = new URLSearchParams(location.search).get("for");
  const variant = variants[kind];
  if (variant) {
    document.querySelectorAll("[data-variant]").forEach((el) => (el.hidden = el.dataset.variant !== kind));
    form.querySelector("[data-org-label]").textContent = variant.org;
    form.querySelector('label[for="f-email"]').textContent = variant.email;
    if (variant.role) form.elements.role.value = variant.role;
    if (kind === "family") {
      form.querySelectorAll("[data-org-only]").forEach((el) => (el.hidden = true));
      form.querySelector("[data-notes-label]").firstChild.textContent = "Anything we should know when we contact them? ";
    }
    form.elements.interest.value = kind;
    submit.textContent = variant.submit;
    done.querySelector("[data-done-text]").textContent = variant.done;
    messages.organization = `Please enter your ${variant.org.toLowerCase()}.`;
  }
  const submitLabel = submit.textContent;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  form.elements.timezone.value = timezone;
  document.getElementById("f-tz").textContent = `Times are in your time zone (${timezone.replace(/_/g, " ")}).`;

  function validate(field) {
    const ok = field.value.trim() !== "" && field.checkValidity();
    const err = document.getElementById(field.id + "-err");
    field.setAttribute("aria-invalid", String(!ok));
    err.textContent = ok ? "" : messages[field.name];
    if (ok) field.removeAttribute("aria-describedby");
    else field.setAttribute("aria-describedby", err.id);
    return ok;
  }

  form.querySelectorAll("input, select").forEach((f) =>
    f.addEventListener("blur", () => f.hasAttribute("aria-invalid") && validate(f))
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    const invalid = [...form.elements].filter((f) => f.name in messages && !validate(f));
    if (invalid.length) return invalid[0].focus();

    const data = Object.fromEntries(new FormData(form));
    data.times = new FormData(form).getAll("times").join(", ");
    submit.disabled = true;
    submit.textContent = "Sending…";
    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.hidden = true;
      done.hidden = false;
      done.focus();
    } catch {
      status.textContent = "Something went wrong sending your request. Please try again in a moment.";
      submit.disabled = false;
      submit.textContent = submitLabel;
    }
  });
}
