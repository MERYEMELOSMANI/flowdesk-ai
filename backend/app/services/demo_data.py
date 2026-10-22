"""
Demo dataset generator for FlowDesk AI.
Generates realistic enterprise tickets and support agents with diverse skills and capacities.
Guarantees an overloaded scenario so OR-Tools CP-SAT discrete optimization is highlighted.
"""

from typing import List
from datetime import datetime
from app.models.ticket import Ticket
from app.models.employee import SupportAgent

def get_demo_agents() -> List[SupportAgent]:
    return [
        SupportAgent(
            id="AGT-101",
            name="Elena Rostova",
            role="Senior Cloud & SRE Engineer",
            skills=["Technical Support", "Service Request"],
            availability="Available",
            max_workload_hours=7.0,
            current_assigned_hours=0.0,
            remaining_capacity_hours=7.0,
            assigned_ticket_ids=[]
        ),
        SupportAgent(
            id="AGT-102",
            name="Marcus Vance",
            role="Enterprise Billing & Contracts Specialist",
            skills=["Billing", "General Inquiry"],
            availability="Available",
            max_workload_hours=6.5,
            current_assigned_hours=0.0,
            remaining_capacity_hours=6.5,
            assigned_ticket_ids=[]
        ),
        SupportAgent(
            id="AGT-103",
            name="Aisha Patel",
            role="Identity & Security Operations Lead",
            skills=["Account Management", "Service Request"],
            availability="Available",
            max_workload_hours=6.0,
            current_assigned_hours=0.0,
            remaining_capacity_hours=6.0,
            assigned_ticket_ids=[]
        ),
        SupportAgent(
            id="AGT-104",
            name="David Kim",
            role="Core Infrastructure Systems Admin",
            skills=["Technical Support", "Account Management"],
            availability="Available",
            max_workload_hours=5.5,
            current_assigned_hours=0.0,
            remaining_capacity_hours=5.5,
            assigned_ticket_ids=[]
        ),
        SupportAgent(
            id="AGT-105",
            name="Sophia Laurent",
            role="Client Relations & Tier 1 Desk Lead",
            skills=["General Inquiry", "Billing"],
            availability="Available",
            max_workload_hours=5.0,
            current_assigned_hours=0.0,
            remaining_capacity_hours=5.0,
            assigned_ticket_ids=[]
        ),
        SupportAgent(
            id="AGT-106",
            name="Tariq Al-Mansoor",
            role="Database & Production Operations Architect",
            skills=["Technical Support", "Service Request"],
            availability="Busy",  # Initial busy/unavailable creates realistic overload bottleneck
            max_workload_hours=6.0,
            current_assigned_hours=0.0,
            remaining_capacity_hours=6.0,
            assigned_ticket_ids=[]
        )
    ]

def get_demo_tickets() -> List[Ticket]:
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    return [
        # Technical Support (Critical and standard)
        Ticket(
            id="TCK-1001",
            title="Production Postgres replica connection pool exhausted",
            description="Production Postgres replica throwing 504 gateway timeouts. Backend API cannot connect.",
            category="Technical Support",
            priority="P1",
            estimated_hours=2.5,
            sla_deadline_hours=2.0,
            status="Unassigned",
            ml_confidence=0.91,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1002",
            title="GlobalProtect VPN gateway dropping every 15 minutes",
            description="Remote engineering staff in EMEA disconnecting during calls when switching networks.",
            category="Technical Support",
            priority="P2",
            estimated_hours=1.5,
            sla_deadline_hours=4.0,
            status="Unassigned",
            ml_confidence=0.88,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1003",
            title="Kubernetes auth service pod in CrashLoopBackOff",
            description="Container repeatedly dying with OOMKilled code 137 under peak morning traffic.",
            category="Technical Support",
            priority="P1",
            estimated_hours=3.0,
            sla_deadline_hours=1.5,
            status="Unassigned",
            ml_confidence=0.94,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1004",
            title="SSL wildcard certificate expiring in 6 hours on payment gateway",
            description="Browser security warnings NET::ERR_CERT_DATE_INVALID triggering on customer checkout.",
            category="Technical Support",
            priority="P1",
            estimated_hours=1.0,
            sla_deadline_hours=3.0,
            status="Unassigned",
            ml_confidence=0.89,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1005",
            title="Redis cache memory spike causing 3500ms API latency",
            description="Unindexed session lookup keys causing cache eviction loops and microservice degradation.",
            category="Technical Support",
            priority="P2",
            estimated_hours=2.0,
            sla_deadline_hours=6.0,
            status="Unassigned",
            ml_confidence=0.86,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1006",
            title="Intermittent monitor flicker on 4K workstation dock",
            description="External screen turns black for 2 seconds every hour on engineering workstation.",
            category="Technical Support",
            priority="P4",
            estimated_hours=1.0,
            sla_deadline_hours=24.0,
            status="Unassigned",
            ml_confidence=0.82,
            is_low_confidence=False,
            created_at=now_str
        ),

        # Billing (Urgent disputes and invoice operations)
        Ticket(
            id="TCK-1007",
            title="Duplicate Amex charge $24,800 for annual enterprise contract",
            description="Two identical charges appeared on corporate American Express card for invoice INV-2026.",
            category="Billing",
            priority="P1",
            estimated_hours=2.0,
            sla_deadline_hours=3.0,
            status="Unassigned",
            ml_confidence=0.92,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1008",
            title="Discrepancy in monthly corporate invoice #INV-8821",
            description="Billed for 120 enterprise seats instead of 85 contracted seats. Need immediate credit memo.",
            category="Billing",
            priority="P2",
            estimated_hours=1.5,
            sla_deadline_hours=6.0,
            status="Unassigned",
            ml_confidence=0.87,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1009",
            title="SWIFT wire transfer $65,000 not credited to account ledger",
            description="Treasury sent wire 5 business days ago, but automated portal shows account past due.",
            category="Billing",
            priority="P2",
            estimated_hours=2.0,
            sla_deadline_hours=8.0,
            status="Unassigned",
            ml_confidence=0.89,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1010",
            title="Update Accounts Payable remittance email address",
            description="Please update billing notification email to finance-ap@enterprise.com for Q3 audits.",
            category="Billing",
            priority="P3",
            estimated_hours=0.5,
            sla_deadline_hours=12.0,
            status="Unassigned",
            ml_confidence=0.85,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1011",
            title="Request pro-rated refund for 15 decommissioned seats",
            description="Downsized sales development team; requesting credit memo for remaining 6 months.",
            category="Billing",
            priority="P3",
            estimated_hours=1.5,
            sla_deadline_hours=16.0,
            status="Unassigned",
            ml_confidence=0.84,
            is_low_confidence=False,
            created_at=now_str
        ),

        # Account Management (Security, access, onboarding)
        Ticket(
            id="TCK-1012",
            title="Emergency access revocation for departing executive contractor",
            description="Immediate offboarding: terminate Okta SSO, AWS IAM credentials, and GitHub org access.",
            category="Account Management",
            priority="P1",
            estimated_hours=1.0,
            sla_deadline_hours=1.0,
            status="Unassigned",
            ml_confidence=0.95,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1013",
            title="Lost YubiKey hardware token - reset MFA bypass",
            description="Senior lead architect lost hardware MFA token during travel; unable to log in to AWS.",
            category="Account Management",
            priority="P2",
            estimated_hours=1.0,
            sla_deadline_hours=4.0,
            status="Unassigned",
            ml_confidence=0.91,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1014",
            title="Role-based access permission upgrade for Senior Data Analyst",
            description="Grant read access to BigQuery revenue schema following internal promotion.",
            category="Account Management",
            priority="P3",
            estimated_hours=1.0,
            sla_deadline_hours=12.0,
            status="Unassigned",
            ml_confidence=0.83,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1015",
            title="User locked out after 5 invalid password attempts in Active Directory",
            description="Employee unable to access workstation email after forgetting updated password.",
            category="Account Management",
            priority="P3",
            estimated_hours=0.5,
            sla_deadline_hours=8.0,
            status="Unassigned",
            ml_confidence=0.90,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1016",
            title="Transfer ownership of 12 shared executive dashboard reports",
            description="Departing analytics manager owns key corporate dashboards; reassign to team lead.",
            category="Account Management",
            priority="P4",
            estimated_hours=1.0,
            sla_deadline_hours=24.0,
            status="Unassigned",
            ml_confidence=0.79,
            is_low_confidence=False,
            created_at=now_str
        ),

        # Service Request (Hardware, environments, tooling)
        Ticket(
            id="TCK-1017",
            title="Provision high-spec MacBook Pro M3 Max 64GB for AI researcher",
            description="Urgent hardware request for incoming Principal ML Scientist starting this week.",
            category="Service Request",
            priority="P2",
            estimated_hours=2.5,
            sla_deadline_hours=8.0,
            status="Unassigned",
            ml_confidence=0.86,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1018",
            title="Deploy isolated staging PostgreSQL 16 RDS cluster in AWS",
            description="QA automation team needs dedicated database instance with 200GB storage for load test.",
            category="Service Request",
            priority="P2",
            estimated_hours=3.0,
            sla_deadline_hours=6.0,
            status="Unassigned",
            ml_confidence=0.88,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1019",
            title="Install JetBrains IntelliJ Ultimate license for backend team",
            description="Need corporate license key allocation and setup instructions for new developer.",
            category="Service Request",
            priority="P3",
            estimated_hours=0.5,
            sla_deadline_hours=12.0,
            status="Unassigned",
            ml_confidence=0.85,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1020",
            title="Setup automated weekly S3 bucket database export snapshot",
            description="Configure automated cron job to export sanitized database backup to cold archive.",
            category="Service Request",
            priority="P3",
            estimated_hours=2.0,
            sla_deadline_hours=18.0,
            status="Unassigned",
            ml_confidence=0.83,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1021",
            title="Order replacement wireless ergonomic keyboard",
            description="Spacebar sticking on desk workstation; request Logitech wireless keyboard.",
            category="Service Request",
            priority="P4",
            estimated_hours=0.5,
            sla_deadline_hours=36.0,
            status="Unassigned",
            ml_confidence=0.80,
            is_low_confidence=False,
            created_at=now_str
        ),

        # General Inquiry (Compliance, documentation, ambiguous edge case)
        Ticket(
            id="TCK-1022",
            title="Request copy of latest SOC2 Type II audit certification report",
            description="Banking prospect compliance team requires our 2026 SOC2 Type II certification report.",
            category="General Inquiry",
            priority="P2",
            estimated_hours=1.0,
            sla_deadline_hours=4.0,
            status="Unassigned",
            ml_confidence=0.87,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1023",
            title="Inquiry regarding 2026 corporate observed holiday calendar",
            description="Where can distributed remote contractors find the official list of observed holidays?",
            category="General Inquiry",
            priority="P4",
            estimated_hours=0.5,
            sla_deadline_hours=48.0,
            status="Unassigned",
            ml_confidence=0.88,
            is_low_confidence=False,
            created_at=now_str
        ),
        Ticket(
            id="TCK-1024",
            title="Ambiguous inquiry regarding system integration parameters",
            description="Hello team, we are wondering about various options and things related to system setup.",
            category="General Inquiry",
            priority="P4",
            estimated_hours=1.5,
            sla_deadline_hours=24.0,
            status="Unassigned",
            ml_confidence=0.36,  # Intentionally low confidence to showcase ML manual review flag!
            is_low_confidence=True,
            created_at=now_str
        ),
    ]
