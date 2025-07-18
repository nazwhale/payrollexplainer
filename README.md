# UK Payroll Explainer

An interactive web application that explains and compares different methods for calculating Directors' National Insurance in the UK.

## 🎯 Purpose

This tool helps payroll professionals, accountants, and company directors understand the difference between the **Standard (annual)** and **Alternative** methods for calculating Directors' National Insurance contributions.

### The "Bucket vs Drip-feed" Analogy

- **Standard (annual) method** = *One big bucket*: NI is calculated annually, creating sudden spikes when cumulative pay exceeds thresholds
- **Alternative method** = *Drip-feed*: NI is calculated per pay period like regular employees, with a year-end true-up
- **Employees (non-directors)** = *Always drip-feed*, no balancing step

## ✨ Features

- **Interactive Salary Slider** (£5k → £200k)
- **Pay Frequency Selector** (monthly/weekly)
- **Director Start Date Picker** (handles mid-year appointments)
- **Per-pay-run NI Chart** - Shows the "spike vs smooth" contrast
- **Cumulative NI Chart** - Proves totals end up identical while cash-flow differs
- **Real-time Calculations** - Updates instantly as you adjust parameters
- **Copy Explanation** - Generate ready-to-use explanations for stakeholders

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛠 Tech Stack

- **React 19** + **Vite** - Fast development and building
- **Chart.js** - Interactive data visualization
- **Tailwind CSS v4** - Modern styling
- **Shadcn/UI** - Beautiful, accessible components
- **Framer Motion** - Smooth animations

## 📊 How It Works

The application calculates National Insurance using the 2025/26 thresholds:
- **Primary Threshold (PT)**: £12,570 annually
- **Upper Earnings Limit (UEL)**: £50,270 annually

### Calculation Methods

1. **Standard (Annual) Method**: Waits until cumulative salary exceeds the annual PT before NI starts
2. **Alternative Method**: Calculates NI per pay period, then applies a year-end balancing charge
3. **Employee Baseline**: Regular employee calculation for comparison

## 🎨 Design Philosophy

- **Visual-first learning** - Charts tell the story better than text
- **Instant feedback** - Real-time updates as you adjust parameters
- **Mobile-friendly** - Responsive design works on all devices
- **Accessible** - WCAG compliant with proper contrast and keyboard navigation

## 📈 Use Cases

- **Payroll teams** explaining NI methods to directors
- **Accountants** demonstrating cash flow differences to clients
- **HR professionals** training on director payroll
- **Company directors** understanding their NI obligations

## 🔗 Resources

- [HMRC Directors' National Insurance Guide](https://www.gov.uk/employee-directors)
- [CA44 - National Insurance for Company Directors](https://assets.publishing.service.gov.uk/media/6602cbe565ca2fa78e7da8a0/CA44_April_2024.pdf)
- [Work out a director's National Insurance contributions](https://www.gov.uk/guidance/work-out-directors-national-insurance-contributions)

## 📄 License

This project is open source and available under the MIT License.
