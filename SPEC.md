Create a simple webapp to explain the UK payroll NI methods for directors. https://www.gov.uk/employee-directors

**Fast route to an “aha!” moment**

1. **Anchor the mental model – use the *bucket vs drip-feed* analogy**

   * **Standard (annual) method** = *one big bucket*: you ignore the weekly / monthly thresholds until the director’s cumulative pay finally spills over the annual Primary Threshold (PT) – then a *sudden* NI hit lands.
   * **Alternative method** = *drip-feed*: treat each pay run just like an ordinary employee (weekly / monthly thresholds), then do one mini “true-up” calculation at year-end to make sure the annual figure is still correct.
   * **Employees (non-directors)** = *always drip-feed*, no balancing step.
     This single image (“bucket fills → spills” vs “steady drip”) lets non-UK colleagues grasp the cash-flow difference immediately. ([GOV.UK][1], [GOV.UK Assets][2])

2. **What to show – a two-panel micro-dashboard**

   | Panel                        | Why it works                                                | Sketch                                                                                                            |
   | ---------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
   | **Per-pay-run NI bar chart** | Makes the “spike vs smooth” contrast scream off the screen. | Bar heights per month: heavy bar(s) appear suddenly under *standard*, flat bars under *alternative* & *employee*. |
   | **Cumulative NI line**       | Proves totals end up identical while cash-flow differs.     | Three lines (Standard, Alternative, Employee) converge by week / month 52.                                        |

3. **Interactive controls (top of the page)**

   * **Salary slider** – £5k → £200k
   * **Pay frequency selector** – monthly / weekly
   * **Director start-date picker** – handles mid-year appointments (affects annual PT-proration).
     Every UI change instantly re-draws the two charts. Small, intuitive, dopamine-friendly.

4. **Sub-panel call-outs (keep text light)**

   * “Why the big spike?” ➜ one-liner tooltip: “Annual method waits until cumulative salary tops £12,570 before NI starts.”
   * “Year-end true-up” ➜ show a coloured dot on week / month 52 line for alternative method.
   * “Employees” ➜ greyed-out baseline for quick comparison.
   * Tiny info icon linking to the official HMRC wording for audit-trail geeks. ([GOV.UK][3])

5. **Tech stack – dead simple, zero back-end**

   * **React & Vite & Shadcn/UI, tailwind v4**
   * **1 × ES-module:**

     ```js
     import { Chart } from 'https://cdn.jsdelivr.net/npm/chart.js';  
     // calculate thresholds once: £12,570 PT, £50,270 UEL (2025/26) :contentReference[oaicite:2]{index=2}  
     // shove salary, freq & method into a tiny function returning NI per period array  
     // redraw charts on `input` events from the slider / picker  
     ```
   * **No login, no data storage** – runs locally in the browser or embedded in your internal wiki (Confluence / Notion).

6. **Easter-egg insight for the team**

   > The *total* NI paid over the year is identical whichever director method you pick – HMRC only cares about the annual figure – but *cash-flow* differs. That’s why founders on low regular salaries often prefer the alternative method: smaller, predictable deductions help personal budgeting (and stop awkward “why is my take-home £-1k this month?” tickets). ([Makesworth Accountants][4], [Zelt][5])

7. **Extra 20-minute polish (optional)**

   * Colour-blind-safe palette baked into Chart.js defaults.
   * Dark-mode toggle.
   * “Copy explanation” button that fills the clipboard with a ready, plain-English answer your agent can paste into chat.

---

### TL;DR recipe

1. **Use the bucket-versus-drip analogy.**
2. **Two small charts + salary slider = instant clarity.**
3. **Pure front-end: React + Chart.js (no backend, no typescrip).**
4. **Keep copy minimal; let the visuals tell the story.**

Build it in an afternoon, ship it in the same sprint, and watch the “why is my NI so weird?” tickets melt away.

[1]: https://www.gov.uk/employee-directors?utm_source=chatgpt.com "National Insurance for company directors - GOV.UK"
[2]: https://assets.publishing.service.gov.uk/media/6602cbe565ca2fa78e7da8a0/CA44_April_2024.pdf?utm_source=chatgpt.com "[PDF] CA44 - National Insurance for Company Directors - GOV.UK"
[3]: https://www.gov.uk/guidance/work-out-directors-national-insurance-contributions?utm_source=chatgpt.com "Work out a director's National Insurance contributions - GOV.UK"
[4]: https://makesworth.co.uk/understanding-directors-national-insurance-which-method-works-best/?utm_source=chatgpt.com "Director's NIC Methods: Annual vs Alternative"
[5]: https://zelt.app/blog/directors-national-insurance-calculator/?utm_source=chatgpt.com "Directors National Insurance Calculator 2025/26 - Zelt"