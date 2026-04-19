// Accessibility Testing Utilities
// This file provides utilities for testing and validating accessibility features

export interface AccessibilityTest {
  name: string;
  description: string;
  test: () => TestResult;
}

export interface TestResult {
  passed: boolean;
  message: string;
  details?: string;
}

// WCAG 2.1 Level AA Test Suite
export const accessibilityTests: AccessibilityTest[] = [
  {
    name: "Keyboard Navigation",
    description: "Test if all interactive elements are keyboard accessible",
    test: (): TestResult => {
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      let hasKeyboardSupport = true;
      const issues: string[] = [];
      
      focusableElements.forEach((element, index) => {
        // Check if element has focus indicator
        const computedStyle = window.getComputedStyle(element);
        const hasFocusStyle = computedStyle.outline !== 'none' || 
                           computedStyle.boxShadow !== 'none' ||
                           element.getAttribute('data-focus-visible') !== null;
        
        if (!hasFocusStyle) {
          issues.push(`Element at index ${index} lacks focus indicator`);
          hasKeyboardSupport = false;
        }
        
        // Check for proper tab order
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex && parseInt(tabIndex) < 0) {
          issues.push(`Element at index ${index} has negative tabindex`);
          hasKeyboardSupport = false;
        }
      });
      
      return {
        passed: hasKeyboardSupport,
        message: hasKeyboardSupport 
          ? "All interactive elements support keyboard navigation"
          : "Some elements have keyboard navigation issues",
        details: issues.join('; ')
      };
    }
  },
  
  {
    name: "Color Contrast",
    description: "Test color contrast ratios for text and background",
    test: (): TestResult => {
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
      let contrastIssues = 0;
      const issues: string[] = [];
      
      textElements.forEach((element) => {
        const computedStyle = window.getComputedStyle(element);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        // Skip transparent backgrounds
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          return;
        }
        
        // Simple contrast check (would need actual color calculation in production)
        const colorLuminance = getLuminance(color);
        const bgLuminance = getLuminance(backgroundColor);
        const contrast = (Math.max(colorLuminance, bgLuminance) + 0.05) / (Math.min(colorLuminance, bgLuminance) + 0.05);
        
        const fontSize = parseFloat(computedStyle.fontSize);
        const fontWeight = parseInt(computedStyle.fontWeight) || 400;
        const isLargeText = fontSize >= 18 || fontSize >= 14 && fontWeight >= 700;
        const requiredContrast = isLargeText ? 3 : 4.5;
        
        if (contrast < requiredContrast) {
          contrastIssues++;
          issues.push(`Contrast ratio ${contrast.toFixed(2)} below required ${requiredContrast}`);
        }
      });
      
      return {
        passed: contrastIssues === 0,
        message: contrastIssues === 0 
          ? "All text elements meet contrast requirements"
          : `${contrastIssues} text elements have insufficient contrast`,
        details: issues.join('; ')
      };
    }
  },
  
  {
    name: "ARIA Labels",
    description: "Test for proper ARIA labels and descriptions",
    test: (): TestResult => {
      const interactiveElements = document.querySelectorAll('button, input, select, textarea, a, [role="button"]');
      let ariaIssues = 0;
      const issues: string[] = [];
      
      interactiveElements.forEach((element) => {
        const hasLabel = element.hasAttribute('aria-label') ||
                        element.hasAttribute('aria-labelledby') ||
                        element.textContent?.trim() ||
                        element.getAttribute('title') ||
                        element.getAttribute('alt');
        
        const tagName = element.tagName.toLowerCase();
        const needsLabel = ['button', 'input', 'select', 'textarea'].includes(tagName);
        
        if (needsLabel && !hasLabel) {
          ariaIssues++;
          issues.push(`${tagName} element lacks accessible label`);
        }
        
        // Check for invalid ARIA attributes
        const ariaInvalid = element.getAttribute('aria-invalid');
        if (ariaInvalid && ariaInvalid !== 'true' && ariaInvalid !== 'false' && ariaInvalid !== 'grammar' && ariaInvalid !== 'spelling') {
          ariaIssues++;
          issues.push(`Invalid aria-invalid value: ${ariaInvalid}`);
        }
      });
      
      return {
        passed: ariaIssues === 0,
        message: ariaIssues === 0 
          ? "All interactive elements have proper labels"
          : `${ariaIssues} elements have ARIA labeling issues`,
        details: issues.join('; ')
      };
    }
  },
  
  {
    name: "Heading Structure",
    description: "Test for proper heading hierarchy",
    test: (): TestResult => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let headingIssues = 0;
      const issues: string[] = [];
      let previousLevel = 0;
      
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1));
        
        // Check for skipped heading levels
        if (previousLevel > 0 && level > previousLevel + 1) {
          headingIssues++;
          issues.push(`Skipped heading level: h${previousLevel} to h${level}`);
        }
        
        // Check for empty headings
        if (!heading.textContent?.trim()) {
          headingIssues++;
          issues.push(`Empty ${heading.tagName} found`);
        }
        
        previousLevel = level;
      });
      
      // Check for multiple h1s
      const h1Elements = document.querySelectorAll('h1');
      if (h1Elements.length > 1) {
        headingIssues++;
        issues.push(`Multiple h1 elements found: ${h1Elements.length}`);
      }
      
      return {
        passed: headingIssues === 0,
        message: headingIssues === 0 
          ? "Heading structure is properly organized"
          : `${headingIssues} heading structure issues found`,
        details: issues.join('; ')
      };
    }
  },
  
  {
    name: "Form Accessibility",
    description: "Test form elements for accessibility",
    test: (): TestResult => {
      const formElements = document.querySelectorAll('input, select, textarea');
      let formIssues = 0;
      const issues: string[] = [];
      
      formElements.forEach((element) => {
        const hasLabel = element.hasAttribute('aria-label') ||
                        element.hasAttribute('aria-labelledby') ||
                        document.querySelector(`label[for="${element.id}"]`);
        
        if (!hasLabel) {
          formIssues++;
          issues.push(`Form element without label: ${element.tagName}`);
        }
        
        // Check for required field indicators
        if (element.hasAttribute('required')) {
          const ariaRequired = element.getAttribute('aria-required');
          if (ariaRequired !== 'true') {
            formIssues++;
            issues.push(`Required field missing aria-required="true"`);
          }
        }
      });
      
      return {
        passed: formIssues === 0,
        message: formIssues === 0 
          ? "All form elements are properly labeled"
          : `${formIssues} form accessibility issues found`,
        details: issues.join('; ')
      };
    }
  },
  
  {
    name: "Image Alt Text",
    description: "Test for proper alternative text on images",
    test: (): TestResult => {
      const images = document.querySelectorAll('img');
      let imageIssues = 0;
      const issues: string[] = [];
      
      images.forEach((image) => {
        const alt = image.getAttribute('alt');
        
        if (alt === null) {
          imageIssues++;
          issues.push('Image missing alt attribute');
        } else if (alt === '' && !image.hasAttribute('role') && image.getAttribute('aria-hidden') !== 'true') {
          // Check if image is decorative
          const isDecorative = image.closest('[aria-hidden="true"]') ||
                              image.hasAttribute('role') && image.getAttribute('role') === 'presentation';
          if (!isDecorative) {
            imageIssues++;
            issues.push('Image with empty alt text but not marked as decorative');
          }
        }
      });
      
      return {
        passed: imageIssues === 0,
        message: imageIssues === 0 
          ? "All images have proper alternative text"
          : `${imageIssues} image accessibility issues found`,
        details: issues.join('; ')
      };
    }
  }
];

// Helper function to calculate color luminance
function getLuminance(color: string): number {
  // This is a simplified version - in production, you'd want a more accurate color parser
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) return 0;
  
  const [r, g, b] = rgb.map(Number);
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Run all accessibility tests
export function runAccessibilityTests(): { passed: boolean; results: TestResult[] } {
  const results = accessibilityTests.map(test => test.test());
  const passed = results.every(result => result.passed);
  
  return { passed, results };
}

// Generate accessibility report
export function generateAccessibilityReport(): string {
  const { passed, results } = runAccessibilityTests();
  
  let report = '# Accessibility Test Report\n\n';
  report += `Overall Status: ${passed ? 'PASS' : 'FAIL'}\n\n`;
  
  results.forEach((result, index) => {
    const test = accessibilityTests[index];
    report += `## ${test.name}\n`;
    report += `Status: ${result.passed ? 'PASS' : 'FAIL'}\n`;
    report += `Description: ${test.description}\n`;
    report += `Result: ${result.message}\n`;
    if (result.details) {
      report += `Details: ${result.details}\n`;
    }
    report += '\n';
  });
  
  return report;
}

// Client-side accessibility checker (for development)
export function initAccessibilityChecker() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Add keyboard shortcut for accessibility testing (Ctrl+Shift+A)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        const report = generateAccessibilityReport();
        console.log(report);
        
        // Also show in a modal or alert for easier access
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border: 2px solid #333;
          padding: 20px;
          max-width: 80%;
          max-height: 80%;
          overflow: auto;
          z-index: 10000;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        modal.innerHTML = `
          <div>
            <h2>Accessibility Test Report</h2>
            <pre style="white-space: pre-wrap; font-size: 12px;">${report}</pre>
            <button onclick="this.parentElement.parentElement.remove()" style="
              margin-top: 10px;
              padding: 8px 16px;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            ">Close</button>
          </div>
        `;
        
        document.body.appendChild(modal);
      }
    });
  }
}
