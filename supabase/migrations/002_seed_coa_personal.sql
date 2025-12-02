-- Seed data for Chart of Accounts - Personal Finance
-- This seed data provides a comprehensive set of accounts for personal financial management

-- Assets (1000-1999)
-- Insert parent accounts first
INSERT INTO accounts (account_number, name, type, parent_id) VALUES
(1000, 'Current Assets', 'Asset', NULL),
(1100, 'Investments', 'Asset', NULL),
(1200, 'Fixed Assets', 'Asset', NULL),
(1300, 'Other Assets', 'Asset', NULL);

-- Insert child accounts for Current Assets
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 1010, 'Cash on Hand', 'Asset', id FROM accounts WHERE account_number = 1000
UNION ALL
SELECT 1020, 'Checking Account', 'Asset', id FROM accounts WHERE account_number = 1000
UNION ALL
SELECT 1030, 'Savings Account', 'Asset', id FROM accounts WHERE account_number = 1000
UNION ALL
SELECT 1040, 'Emergency Fund', 'Asset', id FROM accounts WHERE account_number = 1000;

-- Insert child accounts for Investments
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 1110, 'Stocks', 'Asset', id FROM accounts WHERE account_number = 1100
UNION ALL
SELECT 1120, 'Bonds', 'Asset', id FROM accounts WHERE account_number = 1100
UNION ALL
SELECT 1130, 'Mutual Funds', 'Asset', id FROM accounts WHERE account_number = 1100
UNION ALL
SELECT 1140, 'Retirement Account (401k)', 'Asset', id FROM accounts WHERE account_number = 1100
UNION ALL
SELECT 1150, 'Retirement Account (IRA)', 'Asset', id FROM accounts WHERE account_number = 1100;

-- Insert child accounts for Fixed Assets
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 1210, 'Primary Residence', 'Asset', id FROM accounts WHERE account_number = 1200
UNION ALL
SELECT 1220, 'Vehicle', 'Asset', id FROM accounts WHERE account_number = 1200
UNION ALL
SELECT 1230, 'Furniture & Appliances', 'Asset', id FROM accounts WHERE account_number = 1200
UNION ALL
SELECT 1240, 'Electronics', 'Asset', id FROM accounts WHERE account_number = 1200;

-- Insert child accounts for Other Assets
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 1310, 'Prepaid Expenses', 'Asset', id FROM accounts WHERE account_number = 1300
UNION ALL
SELECT 1320, 'Accounts Receivable', 'Asset', id FROM accounts WHERE account_number = 1300;

-- Liabilities (2000-2999)
-- Insert parent accounts first
INSERT INTO accounts (account_number, name, type, parent_id) VALUES
(2000, 'Current Liabilities', 'Liability', NULL),
(2100, 'Long-term Liabilities', 'Liability', NULL);

-- Insert child accounts for Current Liabilities
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 2010, 'Credit Card - Primary', 'Liability', id FROM accounts WHERE account_number = 2000
UNION ALL
SELECT 2020, 'Credit Card - Secondary', 'Liability', id FROM accounts WHERE account_number = 2000
UNION ALL
SELECT 2030, 'Personal Loan', 'Liability', id FROM accounts WHERE account_number = 2000
UNION ALL
SELECT 2040, 'Payday Loan', 'Liability', id FROM accounts WHERE account_number = 2000;

-- Insert child accounts for Long-term Liabilities
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 2110, 'Mortgage', 'Liability', id FROM accounts WHERE account_number = 2100
UNION ALL
SELECT 2120, 'Auto Loan', 'Liability', id FROM accounts WHERE account_number = 2100
UNION ALL
SELECT 2130, 'Student Loan', 'Liability', id FROM accounts WHERE account_number = 2100
UNION ALL
SELECT 2140, 'Other Long-term Debt', 'Liability', id FROM accounts WHERE account_number = 2100;

-- Equity (3000-3999)
INSERT INTO accounts (account_number, name, type, parent_id) VALUES
(3000, 'Personal Equity', 'Equity', NULL);

-- Insert child accounts for Equity
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 3010, 'Opening Balance', 'Equity', id FROM accounts WHERE account_number = 3000
UNION ALL
SELECT 3020, 'Retained Earnings', 'Equity', id FROM accounts WHERE account_number = 3000;

-- Income (4000-4999)
-- Insert parent accounts first
INSERT INTO accounts (account_number, name, type, parent_id) VALUES
(4000, 'Primary Income', 'Income', NULL),
(4100, 'Secondary Income', 'Income', NULL),
(4200, 'Investment Income', 'Income', NULL),
(4300, 'Other Income', 'Income', NULL);

-- Insert child accounts for Primary Income
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 4010, 'Salary', 'Income', id FROM accounts WHERE account_number = 4000
UNION ALL
SELECT 4020, 'Wages', 'Income', id FROM accounts WHERE account_number = 4000
UNION ALL
SELECT 4030, 'Bonus', 'Income', id FROM accounts WHERE account_number = 4000
UNION ALL
SELECT 4040, 'Commission', 'Income', id FROM accounts WHERE account_number = 4000;

-- Insert child accounts for Secondary Income
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 4110, 'Freelance Income', 'Income', id FROM accounts WHERE account_number = 4100
UNION ALL
SELECT 4120, 'Side Business', 'Income', id FROM accounts WHERE account_number = 4100
UNION ALL
SELECT 4130, 'Rental Income', 'Income', id FROM accounts WHERE account_number = 4100;

-- Insert child accounts for Investment Income
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 4210, 'Dividends', 'Income', id FROM accounts WHERE account_number = 4200
UNION ALL
SELECT 4220, 'Interest Income', 'Income', id FROM accounts WHERE account_number = 4200
UNION ALL
SELECT 4230, 'Capital Gains', 'Income', id FROM accounts WHERE account_number = 4200;

-- Insert child accounts for Other Income
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 4310, 'Gifts Received', 'Income', id FROM accounts WHERE account_number = 4300
UNION ALL
SELECT 4320, 'Refunds', 'Income', id FROM accounts WHERE account_number = 4300
UNION ALL
SELECT 4330, 'Miscellaneous Income', 'Income', id FROM accounts WHERE account_number = 4300;

-- Expenses (5000-5999)
-- Insert parent accounts first
INSERT INTO accounts (account_number, name, type, parent_id) VALUES
(5000, 'Housing', 'Expense', NULL),
(5100, 'Utilities', 'Expense', NULL),
(5200, 'Food & Groceries', 'Expense', NULL),
(5300, 'Transportation', 'Expense', NULL),
(5400, 'Personal Care', 'Expense', NULL),
(5500, 'Healthcare', 'Expense', NULL),
(5600, 'Entertainment', 'Expense', NULL),
(5700, 'Education', 'Expense', NULL),
(5800, 'Financial Services', 'Expense', NULL),
(5900, 'Gifts & Donations', 'Expense', NULL),
(5950, 'Miscellaneous', 'Expense', NULL);

-- Insert child accounts for Housing
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5010, 'Rent', 'Expense', id FROM accounts WHERE account_number = 5000
UNION ALL
SELECT 5020, 'Mortgage Payment', 'Expense', id FROM accounts WHERE account_number = 5000
UNION ALL
SELECT 5030, 'Property Tax', 'Expense', id FROM accounts WHERE account_number = 5000
UNION ALL
SELECT 5040, 'Home Insurance', 'Expense', id FROM accounts WHERE account_number = 5000
UNION ALL
SELECT 5050, 'Home Maintenance', 'Expense', id FROM accounts WHERE account_number = 5000
UNION ALL
SELECT 5060, 'Home Improvement', 'Expense', id FROM accounts WHERE account_number = 5000;

-- Insert child accounts for Utilities
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5110, 'Electricity', 'Expense', id FROM accounts WHERE account_number = 5100
UNION ALL
SELECT 5120, 'Water', 'Expense', id FROM accounts WHERE account_number = 5100
UNION ALL
SELECT 5130, 'Gas', 'Expense', id FROM accounts WHERE account_number = 5100
UNION ALL
SELECT 5140, 'Internet', 'Expense', id FROM accounts WHERE account_number = 5100
UNION ALL
SELECT 5150, 'Phone', 'Expense', id FROM accounts WHERE account_number = 5100
UNION ALL
SELECT 5160, 'Cable/Streaming', 'Expense', id FROM accounts WHERE account_number = 5100;

-- Insert child accounts for Food & Groceries
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5210, 'Groceries', 'Expense', id FROM accounts WHERE account_number = 5200
UNION ALL
SELECT 5220, 'Dining Out', 'Expense', id FROM accounts WHERE account_number = 5200
UNION ALL
SELECT 5230, 'Coffee & Snacks', 'Expense', id FROM accounts WHERE account_number = 5200
UNION ALL
SELECT 5240, 'Alcohol', 'Expense', id FROM accounts WHERE account_number = 5200;

-- Insert child accounts for Transportation
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5310, 'Gas/Fuel', 'Expense', id FROM accounts WHERE account_number = 5300
UNION ALL
SELECT 5320, 'Car Payment', 'Expense', id FROM accounts WHERE account_number = 5300
UNION ALL
SELECT 5330, 'Car Insurance', 'Expense', id FROM accounts WHERE account_number = 5300
UNION ALL
SELECT 5340, 'Car Maintenance', 'Expense', id FROM accounts WHERE account_number = 5300
UNION ALL
SELECT 5350, 'Car Registration', 'Expense', id FROM accounts WHERE account_number = 5300
UNION ALL
SELECT 5360, 'Public Transportation', 'Expense', id FROM accounts WHERE account_number = 5300
UNION ALL
SELECT 5370, 'Parking', 'Expense', id FROM accounts WHERE account_number = 5300
UNION ALL
SELECT 5380, 'Tolls', 'Expense', id FROM accounts WHERE account_number = 5300;

-- Insert child accounts for Personal Care
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5410, 'Haircut', 'Expense', id FROM accounts WHERE account_number = 5400
UNION ALL
SELECT 5420, 'Personal Hygiene', 'Expense', id FROM accounts WHERE account_number = 5400
UNION ALL
SELECT 5430, 'Clothing', 'Expense', id FROM accounts WHERE account_number = 5400
UNION ALL
SELECT 5440, 'Shoes', 'Expense', id FROM accounts WHERE account_number = 5400;

-- Insert child accounts for Healthcare
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5510, 'Health Insurance', 'Expense', id FROM accounts WHERE account_number = 5500
UNION ALL
SELECT 5520, 'Doctor Visits', 'Expense', id FROM accounts WHERE account_number = 5500
UNION ALL
SELECT 5530, 'Dentist', 'Expense', id FROM accounts WHERE account_number = 5500
UNION ALL
SELECT 5540, 'Prescriptions', 'Expense', id FROM accounts WHERE account_number = 5500
UNION ALL
SELECT 5550, 'Gym/Fitness', 'Expense', id FROM accounts WHERE account_number = 5500;

-- Insert child accounts for Entertainment
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5610, 'Movies', 'Expense', id FROM accounts WHERE account_number = 5600
UNION ALL
SELECT 5620, 'Concerts/Events', 'Expense', id FROM accounts WHERE account_number = 5600
UNION ALL
SELECT 5630, 'Hobbies', 'Expense', id FROM accounts WHERE account_number = 5600
UNION ALL
SELECT 5640, 'Subscriptions', 'Expense', id FROM accounts WHERE account_number = 5600
UNION ALL
SELECT 5650, 'Games', 'Expense', id FROM accounts WHERE account_number = 5600
UNION ALL
SELECT 5660, 'Travel', 'Expense', id FROM accounts WHERE account_number = 5600
UNION ALL
SELECT 5670, 'Vacation', 'Expense', id FROM accounts WHERE account_number = 5600;

-- Insert child accounts for Education
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5710, 'Tuition', 'Expense', id FROM accounts WHERE account_number = 5700
UNION ALL
SELECT 5720, 'Books & Supplies', 'Expense', id FROM accounts WHERE account_number = 5700
UNION ALL
SELECT 5730, 'Online Courses', 'Expense', id FROM accounts WHERE account_number = 5700;

-- Insert child accounts for Financial Services
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5810, 'Bank Fees', 'Expense', id FROM accounts WHERE account_number = 5800
UNION ALL
SELECT 5820, 'Investment Fees', 'Expense', id FROM accounts WHERE account_number = 5800
UNION ALL
SELECT 5830, 'Tax Preparation', 'Expense', id FROM accounts WHERE account_number = 5800
UNION ALL
SELECT 5840, 'Interest Expense', 'Expense', id FROM accounts WHERE account_number = 5800;

-- Insert child accounts for Gifts & Donations
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5910, 'Gifts Given', 'Expense', id FROM accounts WHERE account_number = 5900
UNION ALL
SELECT 5920, 'Charitable Donations', 'Expense', id FROM accounts WHERE account_number = 5900
UNION ALL
SELECT 5930, 'Tips', 'Expense', id FROM accounts WHERE account_number = 5900;

-- Insert child accounts for Miscellaneous
INSERT INTO accounts (account_number, name, type, parent_id)
SELECT 5960, 'Pet Expenses', 'Expense', id FROM accounts WHERE account_number = 5950
UNION ALL
SELECT 5970, 'Childcare', 'Expense', id FROM accounts WHERE account_number = 5950
UNION ALL
SELECT 5980, 'Uncategorized', 'Expense', id FROM accounts WHERE account_number = 5950;

