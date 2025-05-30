TEMPLATES = {
    "payment": {
        "rent": {
            "subject": "PlanPago: Rent payment for '{name}' due in {days} days",
            "body": (
                "Hello,\n\n"
                "Your rent payment for contract '{name}' of {amount} EUR is due in {days} days (on {date}).\n"
                "Please ensure the amount is transferred on time.\n\n"
            )
        },
        "insurance": {
            "subject": "PlanPago: Insurance premium for '{name}' due in {days} days",
            "body": (
                "Hello,\n\n"
                "The premium for your insurance '{name}' of {amount} EUR is due in {days} days (on {date}).\n"
                "Please pay on time to keep your coverage active.\n\n"
            )
        },
        "streaming": {
            "subject": "PlanPago: Streaming subscription for '{name}' due in {days} days",
            "body": (
                "Hello,\n\n"
                "Your streaming subscription '{name}' of {amount} EUR is due in {days} days (on {date}).\n"
                "Please renew your subscription on time.\n\n"
            )
        },
        "salary": {
            "subject": "PlanPago: Salary payment in {days} days",
            "body": (
                "Hello,\n\n"
                "Your salary payment of {amount} EUR will be received in {days} days (on {date}).\n"
                "Please check your account statement if needed.\n\n"
            )
        },
        "leasing": {
            "subject": "PlanPago: Leasing rate for '{name}' due in {days} days",
            "body": (
                "Hello,\n\n"
                "The next leasing rate for '{name}' of {amount} EUR is due in {days} days (on {date}).\n"
                "Please ensure the funds are available on time.\n\n"
            )
        },
        "other": {
            "subject": "PlanPago: Payment for '{name}' due in {days} days",
            "body": (
                "Hello,\n\n"
                "A payment for your contract '{name}' of {amount} EUR is due in {days} days (on {date}).\n\n"
            )
        },
        "default": {
            "subject": "PlanPago: Payment due in {days} days",
            "body": (
                "Hello,\n\n"
                "A payment of {amount} EUR is due in {days} days (on {date}).\n\n"
            )
        }
    },
    "end": {
        "rent": {
            "subject": "PlanPago: Rent contract '{name}' ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your rent contract '{name}' ends in {days} days (on {date}).\n"
                "You can cancel or renew it as needed.\n\n"
            )
        },
        "insurance": {
            "subject": "PlanPago: Insurance contract '{name}' ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your insurance contract '{name}' ends in {days} days (on {date}).\n"
                "Please check your options for renewal or changes.\n\n"
            )
        },
        "streaming": {
            "subject": "PlanPago: Streaming contract '{name}' ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your streaming contract '{name}' ends in {days} days (on {date}).\n"
                "Please renew your subscription to avoid interruptions.\n\n"
            )
        },
        "salary": {
            "subject": "PlanPago: Salary contract ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your salary contract ends in {days} days (on {date}).\n"
                "Please clarify changes or extensions in time.\n\n"
            )
        },
        "leasing": {
            "subject": "PlanPago: Leasing contract '{name}' ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your leasing contract '{name}' ends in {days} days (on {date}).\n"
                "Consider signing a new contract if needed.\n\n"
            )
        },
        "other": {
            "subject": "PlanPago: Contract '{name}' ends in {days} days",
            "body": (
                "Hello,\n\n"
                "Your contract '{name}' ends in {days} days (on {date}).\n"
                "Please take appropriate action.\n\n"
            )
        },
        "default": {
            "subject": "PlanPago: Contract ends in {days} days",
            "body": (
                "Hello,\n\n"
                "A contract ends in {days} days (on {date}).\n\n"
            )
        }
    },
    "admin_impersonation_request": {
        "subject": "PlanPago: Admin login request",
        "body": (
            "Hello,\n\n"
            "An administrator wants to access your PlanPago account for support purposes.\n"
            "Please confirm this request by clicking the button below.\n\n"
            "If you did not expect this, you can ignore this email.\n\n"
        )
    }
}
