# ==============================================================================
# PROFESSIONAL PROFILE: UNOKO LEWIS
# Core Competencies: Hardware Diagnostics, Retail Operations, & Technical Logistics
# ==============================================================================

class ProfessionalProfile:
    def __init__(self):
        # Identity and Credentials
        self.name = "Unoko Lewis"
        self.profession = "Computer Technical Technician"
        self.consultant = True
        self.provides_home_service = True
        
        # Operational Headquarters
        self.location = {
            "shop_number": "No. 7A",
            "building": "Jekenu, NAF Villa",
            "district": "Asokoro",
            "state_territory": "FCT, Abuja"
        }
        
        # Commercial Inventory Categories
        self.sales_inventory = {
            "hardware": ["Laptops", "Desktops"],
            "mobile_ecosystems": ["iPhone", "Android"],
            "accessories": ["Laptop Accessories", "Phone Accessories"]
        }

    def get_business_overview(self):
        """Generates a structured system summary of commercial and technical capabilities."""
        summary = (
            f"=== BUSINESS IDENTITY ===\n"
            f"Operator: {self.name}\n"
            f"Primary Role: {self.profession} & IT Consultant\n"
            f"Location: {self.location['shop_number']}, {self.location['building']}, "
            f"{self.location['district']}, {self.location['state_territory']}\n\n"
            f"=== COMMERCIAL OFFERINGS ===\n"
            f"Sales: {', '.join(self.sales_inventory['hardware'])} & Mobile Devices "
            f"({', '.join(self.sales_inventory['mobile_ecosystems'])})\n"
            f"Supplies: {', '.join(self.sales_inventory['accessories'])}\n\n"
            f"=== SERVICE DELIVERY MODES ===\n"
            f"• In-Shop Repairs & Diagnostics ({self.location['building']}, {self.location['district']})\n"
            f"• On-Site/Home Service Deployments\n"
            f"• IT Consultation & Procurement Advice"
        )
        return summary


# Instantiate the professional profile object
lewis_profile = ProfessionalProfile()

# Output the dynamic professional profile data
if __name__ == "__main__":
    print(lewis_profile.get_business_overview())
