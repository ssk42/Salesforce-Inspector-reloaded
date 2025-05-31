/* global describe, beforeEach, afterEach, test, expect, jest, require, global */
/* eslint-env jest, node */

describe("Flow Scrollability", () => {
  let mockDocument;
  let mockChrome;
  let mockStorage;
  let mockStyle;
  let mockHeaderFlow;

  beforeEach(() => {
    // Mock document
    mockDocument = {
      head: {
        appendChild: jest.fn()
      },
      createElement: jest.fn(),
      querySelector: jest.fn()
    };

    // Mock chrome storage
    mockStorage = {
      local: {
        get: jest.fn(),
        set: jest.fn()
      }
    };

    // Mock chrome
    mockChrome = {
      storage: mockStorage
    };

    // Mock style element
    mockStyle = {
      textContent: ""
    };

    // Mock header flow element
    mockHeaderFlow = {
      appendChild: jest.fn()
    };

    // Setup document.createElement mock
    mockDocument.createElement.mockImplementation((tag) => {
      if (tag === "style") {
        return mockStyle;
      }
      return {
        addEventListener: jest.fn()
      };
    });

    // Setup document.querySelector mock
    mockDocument.querySelector.mockImplementation((selector) => {
      if (selector === "builder_platform_interaction-container-common") {
        return mockHeaderFlow;
      }
      return null;
    });

    // Setup global mocks
    global.document = mockDocument;
    global.chrome = mockChrome;
    global.location = {
      href: "https://test.salesforce.com/builder_platform_interaction"
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize flow scrollability when in flow builder", () => {
    // Arrange
    const addFlowScrollability = require("./button").addFlowScrollability;
    mockChrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({scrollOnFlowBuilder: true});
    });

    // Act
    addFlowScrollability();

    // Assert
    expect(mockDocument.querySelector).toHaveBeenCalledWith("builder_platform_interaction-container-common");
    expect(mockDocument.createElement).toHaveBeenCalledWith("input");
    expect(mockDocument.createElement).toHaveBeenCalledWith("label");
    expect(mockDocument.createElement).toHaveBeenCalledWith("style");
    expect(mockHeaderFlow.appendChild).toHaveBeenCalledTimes(2);
    expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockStyle);
    expect(mockStyle.textContent).toContain("overflow: auto !important");
  });

  test("should not initialize flow scrollability when not in flow builder", () => {
    // Arrange
    const addFlowScrollability = require("./button").addFlowScrollability;
    global.location.href = "https://test.salesforce.com/some-other-page";

    // Act
    addFlowScrollability();

    // Assert
    expect(mockDocument.querySelector).not.toHaveBeenCalled();
    expect(mockDocument.createElement).not.toHaveBeenCalled();
    expect(mockHeaderFlow.appendChild).not.toHaveBeenCalled();
    expect(mockDocument.head.appendChild).not.toHaveBeenCalled();
  });

  test("should handle checkbox state change", () => {
    // Arrange
    const addFlowScrollability = require("./button").addFlowScrollability;
    let changeCallback;
    mockDocument.createElement.mockImplementation((tag) => {
      if (tag === "input") {
        return {
          addEventListener: (event, callback) => {
            if (event === "change") {
              changeCallback = callback;
            }
          },
          checked: true
        };
      }
      return {
        addEventListener: jest.fn()
      };
    });

    // Act
    addFlowScrollability();
    changeCallback({target: {checked: false}});

    // Assert
    expect(mockChrome.storage.local.set).toHaveBeenCalledWith({scrollOnFlowBuilder: false});
    expect(mockStyle.textContent).toContain("overflow: hidden !important");
  });

  test("should handle sandbox environment", () => {
    // Arrange
    const addFlowScrollability = require("./button").addFlowScrollability;
    global.location.href = "https://test.sandbox.salesforce.com/builder_platform_interaction";

    // Act
    addFlowScrollability();

    // Assert
    expect(mockDocument.createElement).toHaveBeenCalledWith("input");
    const inputElement = mockDocument.createElement.mock.results[0].value;
    expect(inputElement.className).toBe("checkboxScrollSandbox");
  });

  test("should handle production environment", () => {
    // Arrange
    const addFlowScrollability = require("./button").addFlowScrollability;
    global.location.href = "https://test.salesforce.com/builder_platform_interaction";

    // Act
    addFlowScrollability();

    // Assert
    expect(mockDocument.createElement).toHaveBeenCalledWith("input");
    const inputElement = mockDocument.createElement.mock.results[0].value;
    expect(inputElement.className).toBe("checkboxScrollProd");
  });

  test("should handle missing header flow element", () => {
    // Arrange
    const addFlowScrollability = require("./button").addFlowScrollability;
    mockDocument.querySelector.mockReturnValue(null);

    // Act
    addFlowScrollability();

    // Assert
    expect(mockDocument.createElement).not.toHaveBeenCalled();
    expect(mockHeaderFlow.appendChild).not.toHaveBeenCalled();
  });
}); 