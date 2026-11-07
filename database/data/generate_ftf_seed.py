import os
import sqlite3
import uuid
import random
import json
from datetime import datetime, timedelta

def main():
    sql_lines = []
    now = datetime.now()
    
    def q(val):
        if val is None:
            return "NULL"
        if isinstance(val, (int, float)):
            return str(val)
        if isinstance(val, bool):
            return "1" if val else "0"
        s = str(val).replace("'", "''")
        return f"'{s}'"

    def emit(stmt):
        sql_lines.append(stmt.strip())

    emit("-- ===========================================================================")
    emit("-- FTF DIGITAL SOLUTIONS LIMITED (ayo@ftfdigitalsolutions.com) SEED SCRIPT")
    emit("-- Target: BotifyAI.cloud Commerce & Enterprise Telemetry Database")
    emit("-- Client: FTF Digital Solutions Limited (Cross-border logistics & shipping)")
    emit("-- Dynamic Timestamps anchored to active 30-day dashboard reporting window")
    emit("-- ===========================================================================")
    emit("")

    # 1. Clients
    emit("-- 1. Client Enterprise Record")
    created_client = (now - timedelta(days=300)).strftime("%Y-%m-%d %H:%M:%S")
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    emit("INSERT OR REPLACE INTO clients (id, name, email, status, base_currency, currency_symbol, currency_position, primary_color, created_at, updated_at)")
    emit(f"VALUES (10, 'FTF Digital Solutions Limited', 'ayo@ftfdigitalsolutions.com', 'active', 'NGN', '₦', 'before', '#0D9488', '{created_client}', '{now_str}');")
    emit("")

    # 2. Users
    emit("-- 2. Client Administrator (Ayo)")
    emit("INSERT OR REPLACE INTO users (id, client_id, workspace_id, name, email, role, status, client_role, email_verified_at, password, locale, display_currency, timezone, theme, created_at, updated_at)")
    emit(f"VALUES (10, 10, 10, 'Ayo', 'ayo@ftfdigitalsolutions.com', 'client', 'active', 'administrator', '{created_client}', '$2y$12$4e9eDq1EdfgU52i6l8vB0eJ2o3eI9fP2a9b.e.v10F.e12345678', 'en', 'NGN', 'Africa/Lagos', 'light', '{created_client}', '{now_str}');")
    emit("")

    # 3. Workspaces
    emit("-- 3. Enterprise Workspace")
    emit("INSERT OR REPLACE INTO workspaces (id, owner_id, client_id, name, default_locale, currency_code, created_at, updated_at)")
    emit(f"VALUES (10, 10, 10, 'FTF Digital Solutions Workspace', 'en', 'NGN', '{created_client}', '{now_str}');")
    emit("")

    # 4. Workspace User Pivot
    emit("-- 4. Workspace Membership Pivot")
    emit("INSERT OR REPLACE INTO workspace_user (workspace_id, user_id, role, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'owner', '{created_client}', '{now_str}');")
    emit("")

    # 5. Client Subscription
    emit("-- 5. Active Enterprise Subscription")
    renews_str = (now + timedelta(days=60)).strftime("%Y-%m-%d %H:%M:%S")
    emit("INSERT OR REPLACE INTO client_subscriptions (id, client_id, plan_id, billing_cycle, starts_at, ends_at, status, created_at, updated_at)")
    emit(f"VALUES (10, 10, 1, 'monthly', '{created_client}', '{renews_str}', 'active', '{created_client}', '{now_str}');")
    emit("")

    # 6. Channel Accounts
    emit("-- 6. Omnichannel Gateways (WhatsApp, Instagram, Messenger)")
    emit("INSERT OR REPLACE INTO channel_accounts (id, workspace_id, channel, provider, display_name, phone_number_id, credentials, status, created_at, updated_at)")
    emit(f"VALUES (101, 10, 'whatsapp', 'meta', 'FTF Logistics WhatsApp Support & Tracking', '104928572910482', '{{\"system_user_token\":\"EAAG_FTF_LIVE_META_TOKEN_VERIFIED\"}}', 'active', '{created_client}', '{now_str}');")
    emit("INSERT OR REPLACE INTO channel_accounts (id, workspace_id, channel, provider, display_name, credentials, status, created_at, updated_at)")
    emit(f"VALUES (102, 10, 'instagram', 'meta', '@ftflogistics', '{{\"access_token\":\"IG_FTF_VERIFIED_TOKEN\"}}', 'active', '{created_client}', '{now_str}');")
    emit("INSERT OR REPLACE INTO channel_accounts (id, workspace_id, channel, provider, display_name, credentials, status, created_at, updated_at)")
    emit(f"VALUES (103, 10, 'messenger', 'meta', 'FTF Digital Solutions Limited', '{{\"access_token\":\"PAGE_FTF_VERIFIED_TOKEN\"}}', 'active', '{created_client}', '{now_str}');")
    emit("")

    # 7. WhatsApp Business Account & Phone Numbers
    emit("-- 7. WhatsApp Cloud API Integration")
    emit("INSERT OR REPLACE INTO whatsapp_business_accounts (id, workspace_id, waba_id, credentials, webhook_verify_token, status, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'waba_ftf_2024_enterprise', '{{\"system_user_token\":\"EAAG_FTF_LIVE_META_TOKEN_VERIFIED\"}}', 'wh_token_ftf_enterprise_random_9918237', 'active', '{created_client}', '{now_str}');")
    emit("INSERT OR REPLACE INTO whatsapp_phone_numbers (id, waba_id_fk, phone_number_id, display_phone, verified_name, quality_rating, code_verification_status, created_at, updated_at)")
    emit(f"VALUES (10, 10, '104928572910482', '+234 813 366 2232', 'FTF Digital Solutions Limited', 'GREEN', 'VERIFIED', '{created_client}', '{now_str}');")
    emit("")

    # 8. WhatsApp Auto Replies
    emit("-- 8. WhatsApp Instant Quotation & Package Tracking Auto-Replies")
    emit("INSERT OR REPLACE INTO whatsapp_auto_replies (id, workspace_id, keyword, name, match_type, reply_text, is_active, created_at, updated_at)")
    emit(f"VALUES (101, 10, 'track', 'Waybill & Package Status Tracking', 'contains', '📦 FTF Logistics Package Tracker: Please reply with your 8-digit Waybill Number (e.g. WB-100284) to get instant live GPS dispatch status.', 1, '{created_client}', '{now_str}');")
    emit("INSERT OR REPLACE INTO whatsapp_auto_replies (id, workspace_id, keyword, name, match_type, reply_text, is_active, created_at, updated_at)")
    emit(f"VALUES (102, 10, 'quote', 'Instant Shipping Rate Quotation', 'contains', '✈️ FTF Instant Shipping Quotation: Instant rates for UK Air Express, North America Priority Courier, and Nationwide Interstate Delivery.', 1, '{created_client}', '{now_str}');")
    emit("")

    # 9. Merchant Bank Account (MySQL schema: workspace_id, bank_name, bank_code, account_number, account_name, recipient_code, currency, is_default)
    emit("-- 9. Merchant Bank Settlement Account (Zenith Bank PLC)")
    emit("INSERT OR REPLACE INTO merchant_bank_accounts (id, workspace_id, bank_name, bank_code, account_number, account_name, recipient_code, currency, is_default, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'Zenith Bank PLC', '057', '1018400021', 'FTF DIGITAL SOLUTIONS LIMITED', 'RCP_ftf_zenith_verified', 'NGN', 1, '{created_client}', '{now_str}');")
    emit("")

    # 10. Merchant Wallet (₦18,400,000.00 Gross Commercial Revenue)
    emit("-- 10. Merchant Escrow & Settlement Wallet")
    emit("INSERT OR REPLACE INTO merchant_wallets (id, workspace_id, currency, available_balance_cents, pending_balance_cents, total_withdrawn_cents, total_earned_cents, is_frozen, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'NGN', 1840000000, 0, 0, 1840000000, 0, '{created_client}', '{now_str}');")
    emit("")
    emit("-- 10b. Merchant Double-Entry Accounting Ledger")
    emit(f"INSERT OR REPLACE INTO merchant_ledger_entries (id, workspace_id, wallet_id, entry_type, amount_cents, fee_cents, net_amount_cents, running_balance_cents, currency, reference_type, description, created_at, updated_at) VALUES (1, 10, 10, 'sale_credit', 1840000000, 27600000, 1812400000, 1812400000, 'NGN', 'order', 'Cumulative Processed Waybill Bookings & Freight Revenue', '{created_client}', '{now_str}');")
    emit("")

    # 11. Ecommerce Store
    emit("-- 11. Native Digital Commerce Storefront")
    pixels = json.dumps({
        "meta_pixel_id": "104928572910482",
        "meta_capi_token": "EAAG_FTF_CAPI_ACTIVE",
        "ga4_measurement_id": "G-FTFLOGISTICS",
        "tiktok_pixel_id": "TT_FTF_CARGO",
        "gtm_container_id": "GTM-FTF2024",
        "clarity_project_id": "clarity_ftf_live"
    })
    emit("INSERT OR REPLACE INTO ecommerce_stores (id, workspace_id, platform, name, domain, slug, currency, status, support_email, support_phone, brand_color, is_published, bank_account_id, marketing_pixels, published_at, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'native', 'FTF Digital Solutions Limited', 'native', 'ftf-logistics', 'NGN', 'connected', 'ayo@ftfdigitalsolutions.com', '+234 813 366 2232', '#0D9488', 1, 10, '{pixels}', '{created_client}', '{created_client}', '{now_str}');")
    emit("")

    # 12. Products (5 Items)
    emit("-- 12. Store Products (Waybill Services)")
    products = [
        (101, 'Waybill Booking & Freight Service', 40000.00, 'Waybill Booking & Freight Service'),
        (102, 'UK Air Express Cargo (3-5 Days)', 55500.00, 'UK Air Express Cargo (3-5 Days)'),
        (103, 'North America Priority Cargo (5-7 Days)', 75000.00, 'North America Priority Cargo (5-7 Days)'),
        (104, 'Interstate Doorstep Courier Express', 18500.00, 'Interstate Doorstep Courier Express'),
        (105, 'Customs Duty Clearance & Port Handling', 25000.00, 'Customs Duty Clearance & Port Handling')
    ]
    for p_id, p_name, p_price, p_desc in products:
        p_slug = p_name.lower().replace(' ', '-').replace('&', 'and')
        emit(f"INSERT OR REPLACE INTO ecommerce_products (id, workspace_id, store_id, platform, name, slug, price, currency, product_type, description, is_published, created_at, updated_at)")
        emit(f"VALUES ({p_id}, 10, 10, 'native', {q(p_name)}, '{p_slug}', {p_price}, 'NGN', 'digital', {q(p_desc)}, 1, '{created_client}', '{now_str}');")
    emit("")

    # 13. Contacts (Scale to 14,200 active customer contacts)
    emit("-- 13. Customer Contacts (14,200 Active Shippers)")
    named_contacts = [
        (1, 'Emeka', 'Okonkwo', 'emeka.o@meridianlogistics.ng', '+2348031122334', 'Lagos'),
        (2, 'Babatunde', 'Adeyemi', 'tunde.adeyemi@crossborder.co.uk', '+447911123456', 'London'),
        (3, 'Chioma', 'Eze', 'chioma.eze@africantradehub.com', '+2348149988776', 'Abuja'),
        (4, 'Ngozi', 'Okonjo', 'ngozi.okonjo@ftfclient.com', '+2348023456701', 'Enugu'),
        (5, 'Aisha', 'Bello', 'aisha.bello@ftfclient.com', '+2348023456702', 'Kano'),
        (6, 'Tunde', 'Bakare', 'tunde.bakare@ftfclient.com', '+2348023456703', 'Ibadan'),
        (7, 'Chiamaka', 'Nze', 'chiamaka.nze@ftfclient.com', '+2348023456704', 'Owerri'),
        (8, 'Ibrahim', 'Musa', 'ibrahim.musa@ftfclient.com', '+2348023456705', 'Kaduna'),
        (9, 'Amaka', 'Obi', 'amaka.obi@ftfclient.com', '+2348023456706', 'Port Harcourt'),
        (10, 'Yusuf', 'Garba', 'yusuf.garba@ftfclient.com', '+2348023456707', 'Jos'),
        (11, 'Bolaji', 'Davies', 'bolaji.davies@ftfclient.com', '+2348023456708', 'Lagos'),
        (12, 'Fatima', 'Dangote', 'fatima.dangote@ftfclient.com', '+2348023456710', 'Kano')
    ]
    for cid, fn, ln, em, ph, city in named_contacts:
        u = str(uuid.uuid4())
        dt = (now - timedelta(days=random.randint(1, 20))).strftime("%Y-%m-%d %H:%M:%S")
        custom = json.dumps({"destination_city": city, "account_tier": "Enterprise Shipper"})
        emit("INSERT OR REPLACE INTO contacts (id, uuid, workspace_id, phone_e164, email, first_name, last_name, country, language, opt_in_whatsapp, opt_in_sms, opt_in_email, custom_fields, created_at, updated_at)")
        emit(f"VALUES ({cid}, '{u}', 10, '{ph}', '{em}', '{fn}', '{ln}', 'NG', 'en', 1, 1, 1, '{custom}', '{dt}', '{dt}');")

    # Generate additional contacts up to 14,200
    for i in range(13, 14201):
        u = str(uuid.uuid4())
        ph = f"+23480{i:08d}"
        em = f"shipper_{i}@ftfclient.com"
        dt = (now - timedelta(days=random.randint(0, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        emit(f"INSERT OR REPLACE INTO contacts (id, uuid, workspace_id, phone_e164, email, first_name, last_name, country, language, opt_in_whatsapp, opt_in_sms, opt_in_email, created_at, updated_at) VALUES ({i}, '{u}', 10, '{ph}', '{em}', 'Shipper', '{i}', 'NG', 'en', 1, 1, 1, '{dt}', '{dt}');")
    emit("")

    # 14. Conversations (300 total) & Messages (35,657 total)
    emit("-- 14. Real-time Customer Inquiries & Conversations (300 Conversations)")
    for cIdx in range(1, 301):
        st = 'open' if cIdx in (3, 50, 120, 200, 280) else 'resolved'
        c_u = str(uuid.uuid4())
        c_dt = (now - timedelta(days=random.randint(0, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        emit(f"INSERT OR REPLACE INTO conversations (id, uuid, workspace_id, channel_account_id, contact_id, status, assigned_to, unread_count, last_message_at, last_inbound_at, created_at, updated_at) VALUES ({cIdx}, '{c_u}', 10, 101, {cIdx}, '{st}', 'bot', 0, '{c_dt}', '{c_dt}', '{c_dt}', '{c_dt}');")

    emit("-- 15. High-Throughput Messages (35,657 Messages - 18,500 Outbound / 17,157 Inbound)")
    for mIdx in range(1, 35658):
        direction = 'out' if mIdx <= 18500 else 'in'
        conv_id = ((mIdx - 1) % 300) + 1
        m_dt = (now - timedelta(days=random.randint(0, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        body = "📦 Your FTF shipping waybill tracking update has been dispatched." if direction == 'out' else "Hi, please send my waybill GPS delivery schedule."
        emit(f"INSERT OR REPLACE INTO messages (id, conversation_id, direction, channel, type, body, status, sent_by, sent_at, created_at, updated_at) VALUES ({mIdx}, {conv_id}, '{direction}', 'whatsapp', 'text', {q(body)}, 'delivered', '{'bot' if direction=='out' else 'human'}', '{m_dt}', '{m_dt}', '{m_dt}');")
    emit("")

    # 16. Invoices & Orders (500 Orders, exactly ₦18,400,000 across 470 Paid Orders = 94%)
    emit("-- 16. Waybill Invoices & Orders (500 Orders, 470 Paid = 94%, ₦18,400,000 Gross Revenue)")
    screenshot_invs = [
        ('10028401', 'Ngozi Okonjo', 40000.00, 'paid', 2),
        ('10028402', 'Aisha Bello', 24500.00, 'pending', 5),
        ('10028403', 'Tunde Bakare', 32000.00, 'paid', 8),
        ('10028404', 'Chiamaka Nze', 12000.00, 'overdue', 12),
        ('10028405', 'Ibrahim Musa', 18500.00, 'paid', 18),
        ('10028406', 'Amaka Obi', 58000.00, 'pending', 24),
        ('10028407', 'Yusuf Garba', 27800.00, 'paid', 30),
        ('10028408', 'Bolaji Davies', 9000.00, 'overdue', 36),
        ('10028409', 'Chioma Eze', 65000.00, 'pending', 42),
        ('10028410', 'Fatima Dangote', 15000.00, 'paid', 48)
    ]
    screenshot_paid_sum = sum(x[2] for x in screenshot_invs if x[3] == 'paid')
    remaining_paid_count = 470 - sum(1 for x in screenshot_invs if x[3] == 'paid') # 465
    remaining_rev = 18400000.00 - screenshot_paid_sum
    avg_paid = round(remaining_rev / remaining_paid_count, 2)

    for idx, (inv_num, cust, amt, stat, hrs_ago) in enumerate(screenshot_invs, start=1):
        is_paid = (stat == 'paid')
        u = str(uuid.uuid4())
        placed = (now - timedelta(hours=hrs_ago)).strftime("%Y-%m-%d %H:%M:%S")
        paid_dt = placed if is_paid else "NULL"
        lines = json.dumps([{"name": "Waybill Booking & Freight Service", "sku": "FTF-LOGISTICS-SVC", "quantity": 1, "price": amt}])
        emit(f"INSERT OR REPLACE INTO ecommerce_orders (id, workspace_id, store_id, external_order_id, uuid, platform, number, customer_name, customer_email, customer_phone, status, financial_status, payment_status, fulfillment_status, currency, total, line_items, tracking_number, tracking_url, payment_gateway, payment_reference, placed_at, paid_at, created_at, updated_at)")
        emit(f"VALUES ({idx}, 10, 10, 'ftf_inv_{inv_num}', '{u}', 'native', '#{inv_num}', '{cust}', '{cust.lower().replace(' ', '.')}@ftfclient.com', '+23480234567{idx:02d}', '{'completed' if is_paid else 'open'}', '{stat}', '{stat}', '{'fulfilled' if is_paid else 'unfulfilled'}', 'NGN', {amt}, '{lines}', 'WB-{inv_num}', 'https://botifyai.cloud/buy/ftf-logistics/status/WB-{inv_num}', 'paystack', 'pstk_ref_{inv_num}', '{placed}', {q(paid_dt) if is_paid else 'NULL'}, '{placed}', '{placed}');")

    running_sum = screenshot_paid_sum
    for idx in range(11, 501):
        inv_num = f"1002{8400 + idx:04d}"
        is_paid = (idx <= 475)
        stat = 'paid' if is_paid else ('pending' if idx % 2 == 0 else 'overdue')
        if is_paid:
            if idx == 475:
                amt = round(18400000.00 - running_sum, 2)
            else:
                amt = round(avg_paid + random.randint(-12000, 15000), 2)
                running_sum += amt
        else:
            amt = random.choice([12000.00, 18500.00, 24500.00, 32000.00, 58000.00])
        u = str(uuid.uuid4())
        placed = (now - timedelta(days=random.randint(2, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        lines = json.dumps([{"name": "Waybill Booking & Freight Transit", "sku": "FTF-LOGISTICS-SVC", "quantity": 1, "price": amt}])
        emit(f"INSERT OR REPLACE INTO ecommerce_orders (id, workspace_id, store_id, external_order_id, uuid, platform, number, customer_name, customer_email, customer_phone, status, financial_status, payment_status, fulfillment_status, currency, total, line_items, tracking_number, tracking_url, payment_gateway, payment_reference, placed_at, paid_at, created_at, updated_at)")
        emit(f"VALUES ({idx}, 10, 10, 'ftf_inv_{inv_num}', '{u}', 'native', '#{inv_num}', 'Enterprise Client {idx}', 'client_{idx}@ftfclient.com', '+23480{idx:08d}', '{'completed' if is_paid else 'open'}', '{stat}', '{stat}', '{'fulfilled' if is_paid else 'unfulfilled'}', 'NGN', {amt}, '{lines}', 'WB-{inv_num}', 'https://botifyai.cloud/buy/ftf-logistics/status/WB-{inv_num}', 'paystack', 'pstk_ref_{inv_num}', '{placed}', {q(placed) if is_paid else 'NULL'}, '{placed}', '{placed}');")
    emit("")

    # 17. Cart Recovery (100 Carts, 35 Recovered = 35% Recovery Rate)
    emit("-- 17. Automated Cart Recovery (100 Carts, 35 Recovered = 35%)")
    for i in range(1, 101):
        is_rec = (i <= 35)
        ab_dt = (now - timedelta(days=random.randint(1, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        rec_dt = (datetime.strptime(ab_dt, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=random.randint(12, 120))).strftime("%Y-%m-%d %H:%M:%S") if is_rec else None
        tot = random.choice([24500.00, 32000.00, 40000.00, 58000.00, 75000.00])
        lines = json.dumps([{"name": "Waybill Booking & Freight Service", "quantity": 1, "price": 40000.00}])
        emit(f"INSERT OR REPLACE INTO ecommerce_carts (id, workspace_id, store_id, contact_id, external_id, total, currency, line_items, recovery_url, abandoned_at, recovery_triggered_at, recovered_at, created_at, updated_at)")
        emit(f"VALUES ({i}, 10, 10, {i}, 'ftf_cart_{i:05d}', {tot}, 'NGN', '{lines}', 'https://botifyai.cloud/buy/ftf-logistics/checkout/recover?cart=ftf_cart_{i}', '{ab_dt}', '{ab_dt}', {q(rec_dt)}, '{ab_dt}', '{rec_dt or ab_dt}');")
    emit("")

    # 18. Campaign & Usage Meters
    emit("-- 18. Meta WhatsApp Broadcast Campaign (35,657 dispatches, 99.2% delivery, 84% read)")
    totals = json.dumps({
        "total": 35657, "queued": 0, "sent": 35657, "delivered": 35336,
        "read": 29952, "failed": 321, "clicked": 12480, "unsubscribed": 45
    })
    payload = json.dumps({"body": "Hello {{contact.first_name}}, your shipping waybill is ready for dispatch."})
    template = json.dumps({"name": "waybill_dispatch_recovery", "language": "en"})
    camp_u = str(uuid.uuid4())
    emit(f"INSERT OR REPLACE INTO campaigns (id, uuid, workspace_id, name, campaign_type, channel, whatsapp_phone_number_id, audience_type, audience_ref, template_ref, payload_json, schedule_at, timezone, status, totals_json, created_by, created_at, updated_at)")
    emit(f"VALUES (10, '{camp_u}', 10, 'In-Chat Waybill Dispatch & Checkout Recovery', 'broadcast', 'whatsapp', '104928572910482', 'segment', 'Incomplete Checkouts & Active Shippers', '{template}', '{payload}', '{(now - timedelta(days=10)).strftime('%Y-%m-%d %H:%M:%S')}', 'Africa/Lagos', 'completed', '{totals}', 10, '{created_client}', '{now_str}');")
    
    emit("-- 18b. Campaign Delivery Telemetry (500 Recipients)")
    for r in range(1, 501):
        is_fail = (r <= 4)
        is_read = (not is_fail and r <= 424)
        is_deliv = (not is_fail)
        st = 'failed' if is_fail else ('read' if is_read else 'delivered')
        s_dt = (now - timedelta(days=10, minutes=random.randint(1, 55))).strftime("%Y-%m-%d %H:%M:%S")
        deliv_dt = (datetime.strptime(s_dt, "%Y-%m-%d %H:%M:%S") + timedelta(seconds=random.randint(1, 5))).strftime("%Y-%m-%d %H:%M:%S") if is_deliv else None
        read_dt = (datetime.strptime(deliv_dt, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=random.randint(2, 45))).strftime("%Y-%m-%d %H:%M:%S") if is_read else None
        click_dt = (datetime.strptime(read_dt, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=random.randint(1, 10))).strftime("%Y-%m-%d %H:%M:%S") if (is_read and r <= 175) else None
        f_reason = "Meta API temporary provider rejection (321 denied)" if is_fail else None
        emit(f"INSERT OR REPLACE INTO campaign_recipients (id, campaign_id, contact_id, status, provider_message_id, sent_at, delivered_at, read_at, clicked_at, failed_reason, created_at, updated_at) VALUES ({r}, 10, {r}, '{st}', 'wamid.HBgL{uuid.uuid4().hex[:20]}', '{s_dt}', {q(deliv_dt)}, {q(read_dt)}, {q(click_dt)}, {q(f_reason)}, '{s_dt}', '{click_dt or read_dt or deliv_dt or s_dt}');")
    
    emit("-- 19. Monthly Usage Meters")
    period = int(now.strftime("%Y%m"))
    meters = [
        ('whatsapp_messages', 35657), ('sms_sent', 4500), ('emails_sent', 12800),
        ('ai_tokens', 2450000), ('campaigns_sent', 24), ('lead_credits', 14200)
    ]
    for idx, (m, v) in enumerate(meters, start=101):
        emit(f"INSERT OR REPLACE INTO usage_meters (id, workspace_id, metric, period, value, created_at, updated_at) VALUES ({idx}, 10, '{m}', {period}, {v}, '{now_str}', '{now_str}');")
    emit("")

    # 20. AI Knowledge Base & Copilot Runs (500 runs, 98.4% success, sub-second latency)
    emit("-- 20. AI Knowledge Base & Chatbot Copilot Telemetry (500 Runs, 98.4% resolution, sub-second latency)")
    emit(f"INSERT OR REPLACE INTO ai_provider_configs (id, workspace_id, provider, credentials, default_model_chat, default_model_embed, enabled, created_at, updated_at) VALUES (10, 10, 'openai', '{{\"api_key\":\"sk-ftf-production-live-gateway\"}}', 'gpt-4o-mini', 'text-embedding-3-small', 1, '{created_client}', '{now_str}');")
    emit(f"INSERT OR REPLACE INTO ai_knowledge_bases (id, workspace_id, name, embedding_model, dimensions, status, created_at, updated_at) VALUES (10, 10, 'FTF Cross-Border Logistics & Quotation KB', 'text-embedding-3-small', 1536, 'active', '{created_client}', '{now_str}');")
    emit(f"INSERT OR REPLACE INTO ai_kb_documents (id, kb_id, title, source_type, source_ref, status, tokens, last_indexed_at, created_at, updated_at) VALUES (10, 10, 'FTF Shipping Tariffs & Waybill Routing', 'text', 'doc:ftf-logistics-core', 'indexed', 1450, '{(now - timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S')}', '{created_client}', '{now_str}');")
    emit(f"INSERT OR REPLACE INTO ai_kb_chunks (id, kb_id, document_id, ord, content, tokens, created_at, updated_at) VALUES (10, 10, 10, 0, 'FTF Digital Solutions Limited is a leading cross-border logistics company handling local, interstate, and international shipping across Nigeria, the UK, and North America. Express transit is 3-5 days for UK and 5-7 days for North America.', 250, '{created_client}', '{now_str}');")
    emit(f"INSERT OR REPLACE INTO ai_chatbots (id, workspace_id, ai_kb_id, name, system_prompt, tone, max_context_chunks, fallback_reply, channels, enabled, is_default, created_at, updated_at) VALUES (10, 10, 10, 'FTF Logistics AI Quotation & Tracking Copilot', 'You are the official AI Sales Copilot for FTF Digital Solutions Limited.', 'professional', 5, 'Our senior coordinator is reviewing your custom freight booking.', '[\"whatsapp\",\"instagram\",\"messenger\",\"web\"]', 1, 1, '{created_client}', '{now_str}');")

    for r_idx in range(1, 501):
        prompt = random.randint(240, 780)
        comp = random.randint(60, 290)
        is_err = (r_idx % 62 == 0 and r_idx > 0) # 8 errors in 500 = 98.4% ok
        st = 'error' if is_err else 'ok'
        cost = int(((prompt * 0.000015 + comp * 0.00006) * 100) + 1)
        lat = random.randint(380, 720) # sub-second latency
        r_dt = (now - timedelta(days=random.randint(0, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        emit(f"INSERT OR REPLACE INTO ai_runs (id, chatbot_id, prompt_tokens, completion_tokens, cost_cents, latency_ms, model, status, created_at, updated_at) VALUES ({r_idx}, 10, {prompt}, {comp}, {cost}, {lat}, 'gpt-4o-mini', '{st}', '{r_dt}', '{r_dt}');")

    # 21. Automations (4 Active Workflows)
    emit("-- 21. Active Workflows (4 Automations)")
    autos = [
        (101, 'WhatsApp Instant Package & Waybill Tracking', 'message_received'),
        (102, 'Automated In-Chat Instant Quotation & Rate Calculator', 'inquiry_received'),
        (103, 'Meta API Abandoned Cart Recovery Sequence', 'cart_abandoned'),
        (104, 'Event-Driven Omnichannel Lead Routing (FastAPI / Redis)', 'lead_qualified')
    ]
    for aid, aname, atrig in autos:
        emit(f"INSERT OR REPLACE INTO automations (id, workspace_id, name, trigger_type, status, definition_json, created_by, created_at, updated_at) VALUES ({aid}, 10, {q(aname)}, '{atrig}', 'active', '{{\"nodes\":[],\"edges\":[]}}', 10, '{created_client}', '{now_str}');")
        for ar in range(1, 13):
            ar_id = (aid * 100) + ar
            s_dt = (now - timedelta(days=random.randint(0, 20), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
            emit(f"INSERT OR REPLACE INTO automation_runs (id, automation_id, workspace_id, status, started_at, completed_at, created_at, updated_at) VALUES ({ar_id}, {aid}, 10, 'success', '{s_dt}', '{s_dt}', '{s_dt}', '{s_dt}');")
    emit("")

    # Write SQL script
    sql_path = "database/data/ftf_digital_solutions_seed.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"Generated {len(sql_lines)} SQL statements in {sql_path}")

    # Populate SQLite database
    db_path = "database/database.sqlite"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA synchronous = OFF")
    cur.execute("PRAGMA journal_mode = MEMORY")
    
    # Ensure tables exist
    cur.execute("DROP TABLE IF EXISTS merchant_bank_accounts")
    cur.execute("CREATE TABLE IF NOT EXISTS merchant_bank_accounts (id INTEGER PRIMARY KEY, workspace_id INTEGER, bank_name TEXT, bank_code TEXT, account_number TEXT, account_name TEXT, recipient_code TEXT, currency TEXT DEFAULT 'NGN', is_default INTEGER DEFAULT 1, created_at DATETIME, updated_at DATETIME)")
    cur.execute("CREATE TABLE IF NOT EXISTS merchant_wallets (id INTEGER PRIMARY KEY, workspace_id INTEGER, currency TEXT DEFAULT 'NGN', available_balance_cents INTEGER DEFAULT 0, pending_balance_cents INTEGER DEFAULT 0, total_withdrawn_cents INTEGER DEFAULT 0, total_earned_cents INTEGER DEFAULT 0, is_frozen INTEGER DEFAULT 0, created_at DATETIME, updated_at DATETIME)")
    cur.execute("CREATE TABLE IF NOT EXISTS merchant_ledger_entries (id INTEGER PRIMARY KEY, workspace_id INTEGER, wallet_id INTEGER, entry_type TEXT, amount_cents INTEGER, fee_cents INTEGER, net_amount_cents INTEGER, running_balance_cents INTEGER, currency TEXT, reference_type TEXT, reference_id INTEGER, description TEXT, created_at DATETIME, updated_at DATETIME)")
    try:
        cur.execute("ALTER TABLE ecommerce_stores ADD COLUMN bank_account_id INTEGER")
    except Exception:
        pass
    try:
        cur.execute("ALTER TABLE campaigns ADD COLUMN campaign_type VARCHAR(64) DEFAULT 'newsletter'")
    except Exception:
        pass

    # Execute all lines
    full_sql = "\n".join(sql_lines)
    cur.executescript(full_sql)
    conn.commit()
    conn.close()
    print("Populated database/database.sqlite successfully.")

if __name__ == '__main__':
    main()
