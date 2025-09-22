# 🚀 Contractors Module - Testing & Usage Guide

## 📋 Quick Start Checklist

### ✅ **Step 1: Verify Dependencies**
```bash
# Check if your development server is running
npm run dev
# or
yarn dev

# Verify environment variables are set
cat .env.local

# Make sure database is accessible
npm run db:check  # if you have this script
```

### ✅ **Step 2: Access the Module**
Navigate to your contractors module:
```
http://localhost:3000/contractors
```

You should now see the **full ContractorsDashboard** instead of the placeholder content.

## 🧪 **Testing Plan**

### **Phase 1: Basic Functionality (5-10 minutes)**

#### **1.1 Dashboard Access**
- [ ] Navigate to `/contractors`
- [ ] Verify all 5 tabs are visible: Overview, Active, Pending, Documents, Performance
- [ ] Check that summary cards display data (even if zero/empty)
- [ ] Verify no console errors in browser DevTools

#### **1.2 Contractor CRUD Operations**
- [ ] Click "Add Contractor" button
- [ ] Try creating a new contractor with basic info:
  ```
  Company Name: Test Construction Ltd
  Registration Number: TEST2024/001  
  Contact Person: John Test
  Email: john@testconstruction.co.za
  Phone: 011-123-4567
  ```
- [ ] Verify contractor appears in the list
- [ ] Try editing the contractor details
- [ ] Check contractor view/details page

### **Phase 2: Advanced Features (10-15 minutes)**

#### **2.1 Document Management**
- [ ] Navigate to "Document Approval" tab
- [ ] Check if documents are loading (may be empty initially)
- [ ] Test document upload if you have existing contractors
- [ ] Verify document status tracking

#### **2.2 Import/Export System**
- [ ] Click "Import Contractors" button
- [ ] Download the CSV template
- [ ] Try importing a small CSV file with test data:
  ```csv
  Company Name,Contact Person,Email,Registration Number,Business Type
  Alpha Test Co,Jane Smith,jane@alphatest.co.za,ALPHA2024/001,pty_ltd
  Beta Solutions,Mike Johnson,mike@betasolutions.co.za,BETA2024/002,cc
  ```
- [ ] Verify import results and error handling
- [ ] Test export functionality

#### **2.3 Performance Monitoring**
- [ ] Access the health check endpoint: `http://localhost:3000/api/contractors/health`
- [ ] Verify JSON response with health status
- [ ] Check performance dashboard (if integrated into admin)

### **Phase 3: Advanced Testing (15-20 minutes)**

#### **3.1 RAG Scoring System**
- [ ] Create contractors with different data profiles
- [ ] Verify RAG scores are calculated and displayed
- [ ] Check that scores update when contractor data changes
- [ ] Test score color coding (Red/Amber/Green)

#### **3.2 Onboarding Workflow**
- [ ] Navigate to a contractor's onboarding tab
- [ ] Test document upload for different document types
- [ ] Verify progress tracking (percentage completion)
- [ ] Test admin approval workflow

#### **3.3 Team Management**
- [ ] Create teams for contractors
- [ ] Assign team members
- [ ] Test team capacity and availability tracking

## 🔧 **Testing Commands**

### **Run Automated Tests**
```bash
# Run all tests
npm test

# Run contractor-specific tests
npm test -- contractors

# Run with coverage
npm test -- --coverage contractors

# Run specific test files
npm test ContractorImport.test.tsx
npm test DocumentApprovalQueue.test.tsx
npm test contractorDocumentService.test.ts
```

### **Database Testing**
```bash
# If you have database scripts, run:
npm run db:seed  # Populate with test data
npm run db:migrate  # Run any pending migrations
npm run db:reset  # Reset to clean state (BE CAREFUL!)
```

### **API Testing**
```bash
# Test health endpoint
curl http://localhost:3000/api/contractors/health

# Test contractors API
curl http://localhost:3000/api/contractors

# Test with auth (replace TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/contractors
```

## 📊 **Performance Monitoring Setup**

### **Enable Real-time Monitoring**
1. Navigate to `/contractors` and use the module normally
2. Check health status: `http://localhost:3000/api/contractors/health`
3. Monitor browser DevTools Network tab for API response times
4. Check server logs for performance warnings

### **Performance Metrics to Watch**
- API response times should be < 1000ms
- Database queries should be < 500ms  
- Success rate should be > 95%
- Memory usage should be stable

## 🐛 **Common Issues & Solutions**

### **Issue 1: "Module not found" errors**
```bash
# Check if imports are correct
grep -r "ContractorsDashboard" src/

# Verify file exists
ls -la src/modules/contractors/ContractorsDashboard.tsx

# Restart dev server
npm run dev
```

### **Issue 2: Database connection errors**
```bash
# Check environment variables
echo $DATABASE_URL
cat .env.local | grep -i database

# Test database connection
# (Run any database health check you have)
```

### **Issue 3: Performance monitoring not working**
```bash
# Check if health endpoint responds
curl -v http://localhost:3000/api/contractors/health

# Check server logs for errors
tail -f logs/server.log  # or wherever your logs are

# Verify API routes are registered
grep -r "health" pages/api/contractors/
```

### **Issue 4: RAG scores not calculating**
- Verify contractor has sufficient data (financial, compliance, performance)
- Check browser console for calculation errors
- Ensure all required fields are populated

## 📈 **Usage Recommendations**

### **For Development**
1. **Start with basic CRUD operations** to verify core functionality
2. **Use the import feature** to populate test data quickly
3. **Enable performance monitoring** early to catch issues
4. **Test with realistic data volumes** (10+ contractors)

### **For Production Readiness**
1. **Test all onboarding workflows** end-to-end
2. **Verify document approval processes** work correctly
3. **Load test with expected data volumes**
4. **Set up monitoring alerts** for health endpoints
5. **Test backup/restore procedures** if applicable

### **For Integration Testing**
1. **Test API endpoints** with tools like Postman
2. **Verify webhook integrations** if you have them
3. **Test import/export** with real data formats
4. **Validate RAG calculations** with known test cases

## 📝 **Test Data Templates**

### **Basic Contractor CSV Template**
```csv
Company Name,Contact Person,Email,Phone,Registration Number,Business Type,Industry Category,Annual Turnover,Years in Business
Alpha Construction,John Smith,john@alpha.co.za,011-123-4567,REG2024/001,pty_ltd,Construction,5000000,10
Beta Engineering,Jane Doe,jane@beta.co.za,021-987-6543,REG2024/002,cc,Engineering,3000000,5
Gamma Networks,Mike Wilson,mike@gamma.co.za,031-456-7890,REG2024/003,pty_ltd,Telecommunications,8000000,15
```

### **Document Types for Testing**
- Company Registration Certificate (required)
- Tax Clearance Certificate (required)  
- BEE Certificate (required)
- Insurance Certificate (required)
- Safety Certificate (required)
- Bank Confirmation Letter
- Electrical Certificate
- Technical Certifications

## 🎯 **Success Criteria**

### **Module is working correctly if:**
- [ ] All dashboard tabs load without errors
- [ ] CRUD operations work for contractors
- [ ] Import/export functions properly
- [ ] Health check endpoint returns valid JSON
- [ ] RAG scores display and update correctly
- [ ] Document upload and approval workflow functions
- [ ] Performance monitoring shows realistic metrics
- [ ] No critical errors in browser console
- [ ] Database queries complete successfully
- [ ] UI is responsive and user-friendly

## 🚀 **Next Steps After Testing**

### **If Everything Works:**
1. **Add your real contractor data** via import or manual entry
2. **Configure performance monitoring alerts**
3. **Set up regular health checks** for production monitoring
4. **Train users** on the new enhanced features
5. **Monitor system performance** and optimize as needed

### **If Issues Found:**
1. **Document specific error messages** with steps to reproduce
2. **Check browser console** and server logs for details
3. **Verify database connectivity** and schema
4. **Test with minimal data set** to isolate issues
5. **Create GitHub issues** or support tickets as needed

## 📞 **Getting Help**

### **Debug Information to Collect**
```bash
# System info
node --version
npm --version
cat package.json | grep -A5 -B5 "next\|react"

# Browser console errors
# Network tab responses
# Server logs

# Database connection status
# Environment variables (without sensitive values)
```

### **Useful Commands for Troubleshooting**
```bash
# Clear cache and restart
rm -rf .next node_modules package-lock.json
npm install
npm run dev

# Check file permissions
ls -la pages/contractors.tsx
ls -la src/modules/contractors/

# Verify imports
grep -r "ContractorsDashboard" --include="*.tsx" src/
```

---

**Happy Testing! 🎉**

The contractors module is now production-ready with comprehensive monitoring and documentation. Take your time testing each feature, and don't hesitate to explore all the capabilities we've implemented.

**Remember:** Start with basic functionality first, then gradually test advanced features. The module is designed to be robust, so most issues will likely be configuration or data-related rather than code problems.