import os
import sqlite3
import uuid
import random
import json
from datetime import datetime, timedelta

def main():
    sql_lines = []
    
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
    emit("-- ===========================================================================")
    emit("")

    # 1. Clients
    emit("-- 1. Client Enterprise Record")
    emit("INSERT OR REPLACE INTO clients (id, name, email, status, base_currency, currency_symbol, currency_position, primary_color, created_at, updated_at)")
    emit("VALUES (10, 'FTF Digital Solutions Limited', 'ayo@ftfdigitalsolutions.com', 'active', 'NGN', '₦', 'before', '#0D9488', '2024-01-15 08:00:00', '2024-01-15 08:00:00');")
    emit("")

    # 2. Users
    emit("-- 2. Client Administrator (Ayo)")
    emit("INSERT OR REPLACE INTO users (id, client_id, workspace_id, name, email, role, status, client_role, email_verified_at, password, locale, display_currency, timezone, theme, created_at, updated_at)")
    emit("VALUES (10, 10, 10, 'Ayo', 'ayo@ftfdigitalsolutions.com', 'client', 'active', 'administrator', '2024-01-15 08:30:00', '$2y$12$4e9eDq1EdfgU52i6l8vB0eJ2o3eI9fP2a9b.e.v10F.e12345678', 'en', 'NGN', 'Africa/Lagos', 'light', '2024-01-15 08:00:00', '2024-01-15 08:00:00');")
    emit("")

    # 3. Workspaces
    emit("-- 3. Enterprise Workspace")
    emit("INSERT OR REPLACE INTO workspaces (id, owner_id, client_id, name, default_locale, currency_code, created_at, updated_at)")
    emit("VALUES (10, 10, 10, 'FTF Digital Solutions Workspace', 'en', 'NGN', '2024-01-15 08:00:00', '2024-01-15 08:00:00');")
    emit("")

    # 4. Workspace User Pivot
    emit("-- 4. Workspace Membership Pivot")
    emit("INSERT OR REPLACE INTO workspace_user (workspace_id, user_id, role, created_at, updated_at)")
    emit("VALUES (10, 10, 'owner', '2024-01-15 08:00:00', '2024-01-15 08:00:00');")
    emit("")

    # 5. Client Subscription
    emit("-- 5. Active Enterprise Subscription")
    emit("INSERT OR REPLACE INTO client_subscriptions (id, client_id, plan_id, billing_cycle, starts_at, ends_at, status, created_at, updated_at)")
    emit("VALUES (10, 10, 1, 'monthly', '2024-01-15 09:00:00', '2027-01-15 09:00:00', 'active', '2024-01-15 09:00:00', '2024-01-15 09:00:00');")
    emit("")

    # 6. Channel Accounts
    emit("-- 6. Omnichannel Gateways (WhatsApp, Instagram, Messenger)")
    emit("INSERT OR REPLACE INTO channel_accounts (id, workspace_id, channel, provider, display_name, phone_number_id, credentials, status, created_at, updated_at)")
    emit("VALUES (101, 10, 'whatsapp', 'meta', 'FTF Logistics WhatsApp Support & Tracking', '104928572910482', '{\"system_user_token\":\"EAAG_FTF_LIVE_META_TOKEN_VERIFIED\"}', 'active', '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("INSERT OR REPLACE INTO channel_accounts (id, workspace_id, channel, provider, display_name, credentials, status, created_at, updated_at)")
    emit("VALUES (102, 10, 'instagram', 'meta', '@ftflogistics', '{\"access_token\":\"IG_FTF_VERIFIED_TOKEN\"}', 'active', '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("INSERT OR REPLACE INTO channel_accounts (id, workspace_id, channel, provider, display_name, credentials, status, created_at, updated_at)")
    emit("VALUES (103, 10, 'messenger', 'meta', 'FTF Digital Solutions Limited', '{\"access_token\":\"PAGE_FTF_VERIFIED_TOKEN\"}', 'active', '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("")

    # 7. WhatsApp Business Account & Phone Numbers
    emit("-- 7. WhatsApp Cloud API Integration")
    emit("INSERT OR REPLACE INTO whatsapp_business_accounts (id, workspace_id, waba_id, credentials, webhook_verify_token, status, created_at, updated_at)")
    emit("VALUES (10, 10, 'waba_ftf_2024_enterprise', '{\"system_user_token\":\"EAAG_FTF_LIVE_META_TOKEN_VERIFIED\"}', 'wh_token_ftf_enterprise_random_9918237', 'active', '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("INSERT OR REPLACE INTO whatsapp_phone_numbers (id, waba_id_fk, phone_number_id, display_phone, verified_name, quality_rating, code_verification_status, created_at, updated_at)")
    emit("VALUES (10, 10, '104928572910482', '+234 813 366 2232', 'FTF Digital Solutions Limited', 'GREEN', 'VERIFIED', '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("")

    # 8. WhatsApp Auto Replies
    emit("-- 8. WhatsApp Instant Quotation & Package Tracking Auto-Replies")
    emit("INSERT OR REPLACE INTO whatsapp_auto_replies (id, workspace_id, keyword, name, match_type, reply_text, is_active, created_at, updated_at)")
    emit("VALUES (101, 10, 'track', 'Waybill & Package Status Tracking', 'contains', '📦 FTF Logistics Package Tracker: Please reply with your 8-digit Waybill Number (e.g. WB-100284) to get instant live GPS dispatch status.', 1, '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("INSERT OR REPLACE INTO whatsapp_auto_replies (id, workspace_id, keyword, name, match_type, reply_text, is_active, created_at, updated_at)")
    emit("VALUES (102, 10, 'quote', 'Instant Shipping Rate Quotation', 'contains', '✈️ FTF Instant Shipping Quotation: Instant rates for UK Air Express, North America Priority Courier, and Nationwide Interstate Delivery.', 1, '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("")

    # 9. Ecommerce Store
    emit("-- 9. Native Digital Commerce Storefront")
    pixels = json.dumps({
        "meta_pixel_id": "104928572910482",
        "meta_capi_token": "EAAG_FTF_CAPI_ACTIVE",
        "ga4_measurement_id": "G-FTFLOGISTICS",
        "tiktok_pixel_id": "TT_FTF_CARGO",
        "gtm_container_id": "GTM-FTF2024",
        "clarity_project_id": "clarity_ftf_live"
    })
    emit("INSERT OR REPLACE INTO ecommerce_stores (id, workspace_id, platform, name, domain, slug, currency, status, support_email, support_phone, brand_color, is_published, marketing_pixels, published_at, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'native', 'FTF Digital Solutions - Global Logistics Command', 'native', 'ftf-logistics', 'NGN', 'connected', 'ayo@ftfdigitalsolutions.com', '+234 813 366 2232', '#0D9488', 1, '{pixels}', '2024-01-20 10:00:00', '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("")

    # 10. Settlement Bank Account
    emit("-- 10. Linked Multi-Currency Merchant Bank Account")
    emit("INSERT OR REPLACE INTO merchant_bank_accounts (id, store_id, bank_name, account_number, account_name, currency, is_verified, created_at, updated_at)")
    emit("VALUES (10, 10, 'Zenith Bank PLC', '1018400021', 'FTF DIGITAL SOLUTIONS LIMITED', 'NGN', 1, '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("")

    # 11. Ecommerce Products
    emit("-- 11. Logistics & Shipping Service Products (Catalog Items)")
    products = [
        (101, "UK & Europe Air Express Freight", "FTF-UK-AIR", 40000.00, "International priority air cargo delivery within 3-5 business days."),
        (102, "North America Cross-Border Courier", "FTF-US-EXP", 65000.00, "Direct express courier shipping to USA and Canada with real-time customs clearance."),
        (103, "Nationwide Interstate Freight Booking", "FTF-NG-INTER", 18500.00, "Door-to-door interstate haulage and cargo distribution across Nigeria."),
        (104, "Express Waybill Package Handling", "FTF-WAYBILL", 12000.00, "Real-time GPS waybill tracking, barcoding, and verified recipient signing."),
        (105, "Customs Brokerage & Clearance Escrow", "FTF-CUSTOMS", 58000.00, "Automated customs tariff duty settlement and official port clearance reconciliation.")
    ]
    for pid, name, sku, price, desc in products:
        emit(f"INSERT OR REPLACE INTO ecommerce_products (id, store_id, workspace_id, platform, name, sku, slug, price, compare_at_price, currency, product_type, description, inventory_quantity, status, is_published, created_at, updated_at)")
        emit(f"VALUES ({pid}, 10, 10, 'native', {q(name)}, {q(sku)}, {q(sku.lower())}, {price}, {price*1.25}, 'NGN', 'service', {q(desc)}, 9999, 'active', 1, '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("")

    # 12. Contacts (500 contacts to support 14,200 active customer contacts telemetry & unique campaign recipients)
    emit("-- 12. Customer Contacts (500 Active Accounts)")
    sample_contacts = [
        ("Emeka", "Okonkwo", "emeka.o@meridianlogistics.ng", "+2348031122334", "Lagos", "NG"),
        ("Babatunde", "Adeyemi", "tunde.adeyemi@crossborder.co.uk", "+447911123456", "London", "GB"),
        ("Chioma", "Eze", "chioma.eze@africantradehub.com", "+2348149988776", "Abuja", "NG"),
        ("Michael", "Sterling", "m.sterling@sterlingcargo.ca", "+14165550192", "Toronto", "CA"),
        ("Fatima", "Bello", "fatima.bello@kandocourier.ng", "+2348092233445", "Kano", "NG"),
        ("David", "Adeleke", "d.adeleke@apexshipping.com", "+2347012345678", "Port Harcourt", "NG"),
        ("Grace", "Nnamdi", "grace.n@stemmanuelhospital.com.ng", "+2348133662240", "Abuja", "NG"),
        ("Agboola", "Rotimi", "agboola.r@lifebridgeclinic.com", "+2348056572211", "Lagos", "NG"),
        ("Tariq", "Al-Mansoor", "tariq@gulfconnectfreight.ae", "+971501234567", "Dubai", "AE"),
        ("Kelechi", "Iheanacho", "kelechi@uknigeriaship.com", "+447700900123", "Manchester", "GB"),
    ]

    for i in range(1, 501):
        cid = 1000 + i
        cuuid = f"contact-ftf-{cid}"
        if i <= len(sample_contacts):
            fn, ln, em, ph, city, cty = sample_contacts[i-1]
        else:
            fn = f"Customer{i}"
            ln = f"Shipper{i}"
            em = f"client.{i}@ftfcustomer.ng"
            ph = f"+23480{str(30000000 + i).zfill(8)}"
            city = random.choice(["Lagos", "Abuja", "Port Harcourt", "London", "Manchester", "Toronto"])
            cty = "NG" if ph.startswith("+234") else ("GB" if ph.startswith("+44") else "CA")
        
        emit(f"INSERT OR REPLACE INTO contacts (id, uuid, workspace_id, phone_e164, email, first_name, last_name, country, opt_in_whatsapp, opt_in_sms, opt_in_email, source, created_at, updated_at)")
        emit(f"VALUES ({cid}, {q(cuuid)}, 10, {q(ph)}, {q(em)}, {q(fn)}, {q(ln)}, {q(cty)}, 1, 1, 1, 'whatsapp', '2024-03-01 10:00:00', '2024-03-01 10:00:00');")
    emit("")

    # 13. Ecommerce Orders & Invoices (500 orders totaling exactly ₦18,400,000.00 across 470 paid orders = 94% payment completion rate)
    emit("-- 13. Orders & Waybill Invoices (500 Orders, 470 Paid = 94% Payment Rate, ₦18,400,000.00 Revenue)")
    target_revenue = 18400000.00
    paid_count = 470
    total_orders = 500

    # Screenshot 10 invoices
    screenshot_invoices = [
        ("10028401", "Ngozi Okonjo", 40000.00, "paid", "2025-11-01 11:30:00"),
        ("10028402", "Aisha Bello", 24500.00, "pending", "2025-11-02 11:30:00"),
        ("10028403", "Tunde Bakare", 32000.00, "paid", "2025-11-03 11:30:00"),
        ("10028404", "Chiamaka Nze", 12000.00, "overdue", "2025-11-04 11:30:00"),
        ("10028405", "Ibrahim Musa", 18500.00, "paid", "2025-11-05 11:30:00"),
        ("10028406", "Amaka Obi", 58000.00, "pending", "2025-11-06 11:30:00"),
        ("10028407", "Yusuf Garba", 27800.00, "paid", "2025-11-07 11:30:00"),
        ("10028408", "Bolaji Davies", 9000.00, "overdue", "2025-11-08 11:30:00"),
        ("10028409", "Chioma Eze", 65000.00, "pending", "2025-11-09 11:30:00"),
        ("10028410", "Fatima Dangote", 15000.00, "paid", "2025-11-10 11:30:00"),
    ]

    screenshot_paid_sum = sum(inv[2] for inv in screenshot_invoices if inv[3] == "paid")
    screenshot_paid_cnt = sum(1 for inv in screenshot_invoices if inv[3] == "paid")
    rem_paid_count = paid_count - screenshot_paid_cnt
    rem_revenue = target_revenue - screenshot_paid_sum
    avg_rem_paid = round(rem_revenue / rem_paid_count, 2)

    running_paid_sum = screenshot_paid_sum

    target_loop_paid_end = len(screenshot_invoices) + rem_paid_count # 10 + 465 = 475

    for i in range(1, total_orders + 1):
        oid = 1000 + i
        if i <= len(screenshot_invoices):
            num, cust, amt, stat, dt = screenshot_invoices[i-1]
            is_paid = (stat == "paid")
        else:
            num = f"1002{str(8400 + i).zfill(4)}"
            cust = f"Logistics Client {i}"
            is_paid = (i <= target_loop_paid_end)
            stat = "paid" if is_paid else (random.choice(["pending", "overdue"]))
            dt = "2025-10-15 14:00:00"
            if is_paid:
                if i == target_loop_paid_end:
                    amt = round(target_revenue - running_paid_sum, 2)
                else:
                    jitter = (i % 7 - 3) * 3500.0
                    amt = max(10000.0, round(avg_rem_paid + jitter, 2))
                    running_paid_sum += amt
            else:
                amt = random.choice([12000.00, 18500.00, 24500.00, 32000.00, 58000.00])

        order_status = "completed" if is_paid else "open"
        fulfil = "fulfilled" if is_paid else "unfulfilled"
        ouuid = f"order-ftf-uuid-{oid}"
        ext_id = f"ftf_inv_{num}"
        paid_at = dt if is_paid else "NULL"
        paid_at_sql = q(paid_at) if is_paid else "NULL"

        line_item = json.dumps([{"name": "Waybill Booking & Freight Transit", "sku": "FTF-LOGISTICS-SVC", "quantity": 1, "price": amt}])

        emit(f"INSERT OR REPLACE INTO ecommerce_orders (id, uuid, workspace_id, store_id, contact_id, external_order_id, platform, number, customer_name, customer_email, status, financial_status, payment_status, fulfillment_status, currency, total, line_items, tracking_number, tracking_url, placed_at, paid_at, payment_gateway, payment_reference, created_at, updated_at)")
        emit(f"VALUES ({oid}, {q(ouuid)}, 10, 10, {1000 + (i % 500) + 1}, {q(ext_id)}, 'native', {q('#' + num)}, {q(cust)}, {q(cust.lower().replace(' ', '.') + '@ftfclient.com')}, {q(order_status)}, {q(stat)}, {q(stat)}, {q(fulfil)}, 'NGN', {amt}, {q(line_item)}, {q('WB-' + num)}, {q('https://botifyai.cloud/buy/ftf-logistics/status/WB-' + num)}, {q(dt)}, {paid_at_sql}, 'paystack', {q('pstk_ref_' + num)}, {q(dt)}, {q(dt)});")
    emit("")

    # 14. Ecommerce Carts (100 Carts, exactly 35 Recovered = 35% Recovery Rate)
    emit("-- 14. Automated Cart Recovery (100 Carts, 35 Recovered = 35.0% Direct Recovery Rate)")
    for c in range(1, 101):
        cid = 1000 + c
        is_rec = (c <= 35)
        cart_total = random.choice([18500.00, 24500.00, 32000.00, 40000.00, 58000.00])
        cart_line = json.dumps([{"name": "Cross-Border Freight Waybill Booking", "quantity": 1, "price": cart_total}])
        rec_at = q("2025-10-20 15:45:00") if is_rec else "NULL"

        emit(f"INSERT OR REPLACE INTO ecommerce_carts (id, workspace_id, store_id, contact_id, external_id, total, currency, line_items, recovery_url, abandoned_at, recovery_triggered_at, recovered_at, created_at, updated_at)")
        emit(f"VALUES ({cid}, 10, 10, {1000 + c}, {q('cart_ftf_' + str(8000 + c))}, {cart_total}, 'NGN', {q(cart_line)}, {q('https://botifyai.cloud/buy/ftf-logistics/checkout/recover/' + str(uuid.uuid4()))}, '2025-10-20 14:00:00', '2025-10-20 14:05:00', {rec_at}, '2025-10-20 14:00:00', '2025-10-20 14:00:00');")
    emit("")

    # 15. Campaigns & Recipients (Official Meta Cloud API Broadcast - 35,657 Recipients Telemetry)
    emit("-- 15. Official Meta Cloud API Telemetry Campaign (35,657 Total Recipients, 99.2% Delivery, 84% Read, 321 Denied)")
    totals_json = json.dumps({
        "total": 35657,
        "sent": 35657,
        "delivered": 35336,
        "read": 29952,
        "failed": 321,
        "clicked": 12480,
        "delivered_pct": 99.2,
        "read_pct": 84.0,
        "failed_pct": 0.9,
        "clicked_pct": 35.0
    })
    emit(f"INSERT OR REPLACE INTO campaigns (id, uuid, workspace_id, name, channel, whatsapp_phone_number_id, audience_type, audience_ref, template_ref, payload_json, schedule_at, timezone, status, totals_json, created_by, created_at, updated_at)")
    emit(f"VALUES (10, 'campaign-ftf-meta-telemetry-10', 10, 'Official Meta Cloud API - Cart Recovery & Telemetry Broadcast', 'whatsapp', '104928572910482', 'segment', 'Incomplete Checkouts & Active Shippers', '{{\"name\":\"waybill_dispatch_recovery\",\"language\":\"en\"}}', '{{\"body\":\"Hello, your shipping waybill is ready for dispatch.\"}}', '2025-10-24 10:00:00', 'Africa/Lagos', 'completed', {q(totals_json)}, 10, '2025-10-24 10:00:00', '2025-10-24 10:00:00');")
    emit("")

    # Detailed 500 recipients for reports pagination
    for r in range(1, 501):
        is_failed = (r <= 4) # 4 / 500 = 0.8% ~ 321 / 35657
        is_read = (not is_failed and r <= 424) # 420 of 500 = 84% open rate
        is_del = (not is_failed) # 496 of 500 = 99.2% delivery
        stat = "failed" if is_failed else ("read" if is_read else "delivered")
        del_at = q("2025-10-24 10:00:05") if is_del else "NULL"
        rd_at = q("2025-10-24 10:15:00") if is_read else "NULL"
        fail_at = q("2025-10-24 10:00:03") if is_failed else "NULL"
        clk_at = q("2025-10-24 10:20:00") if (is_read and r <= 175) else "NULL"
        fail_rsn = q("Meta API temporary provider rejection (321 denied)") if is_failed else "NULL"

        emit(f"INSERT OR REPLACE INTO campaign_recipients (id, campaign_id, contact_id, status, provider_message_id, sent_at, delivered_at, read_at, clicked_at, failed_reason, created_at, updated_at)")
        emit(f"VALUES ({1000 + r}, 10, {1000 + r}, {q(stat)}, {q('wamid.HBgL' + str(uuid.uuid4()))}, '2025-10-24 10:00:00', {del_at}, {rd_at}, {clk_at}, {fail_rsn}, '2025-10-24 10:00:00', '2025-10-24 10:00:00');")
    emit("")

    # 16. Usage Meters
    emit("-- 16. Monthly Usage Meters")
    meters = [
        ("whatsapp_messages", 35657),
        ("sms_sent", 4500),
        ("emails_sent", 12800),
        ("ai_tokens", 2450000),
        ("campaigns_sent", 24),
        ("lead_credits", 14200)
    ]
    for m, val in meters:
        emit(f"INSERT OR REPLACE INTO usage_meters (workspace_id, metric, period, value, created_at, updated_at)")
        emit(f"VALUES (10, {q(m)}, 202611, {val}, '2026-11-01 00:00:00', '2026-11-01 00:00:00');")
    emit("")

    # 17. AI Chatbot & Telemetry Runs (Sub-second response latency & 98.4% resolution success)
    emit("-- 17. AI Engine & Latency Telemetry (70%+ Reduction to Sub-Second Latency, 98.4% Resolution)")
    emit("INSERT OR REPLACE INTO ai_provider_configs (id, workspace_id, provider, default_model_chat, default_model_embed, credentials, enabled, created_at, updated_at)")
    emit("VALUES (10, 10, 'openai', 'gpt-4o-mini', 'text-embedding-3-small', '{\"api_key\":\"sk-ftf-production-live-gateway\"}', 1, '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("INSERT OR REPLACE INTO ai_knowledge_bases (id, workspace_id, name, embedding_model, dimensions, status, created_at, updated_at)")
    emit("VALUES (10, 10, 'FTF Cross-Border Logistics & Quotation KB', 'text-embedding-3-small', 1536, 'active', '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("INSERT OR REPLACE INTO ai_kb_documents (id, kb_id, title, source_type, source_ref, status, tokens, last_indexed_at, created_at, updated_at)")
    emit("VALUES (10, 10, 'FTF Shipping Tariffs, Customs Regulations & Waybill Routing', 'text', 'doc:ftf-logistics-core', 'indexed', 1450, '2024-01-20 10:00:00', '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
    emit("INSERT OR REPLACE INTO ai_chatbots (id, workspace_id, ai_kb_id, name, system_prompt, tone, max_context_chunks, fallback_reply, channels, enabled, is_default, created_at, updated_at)")
    emit("VALUES (10, 10, 10, 'FTF Logistics AI Quotation & Tracking Copilot', 'You are the official AI Copilot for FTF Digital Solutions Limited.', 'professional', 5, 'Our coordinator is reviewing your custom freight request.', '[\"whatsapp\",\"instagram\",\"messenger\",\"web\"]', 1, 1, '2024-01-20 10:00:00', '2024-01-20 10:00:00');")

    for i in range(1, 65):
        aid = 1000 + i
        prompt = 240 + (i * 7) % 400
        comp = 60 + (i * 3) % 150
        cost = int(((prompt * 0.000015 + comp * 0.00006) * 100) + 1)
        lat = 380 + (i * 9) % 320 # 380ms - 700ms (sub-second latency!)
        stat = "error" if i == 13 else "ok" # 1 error out of 64 runs = 98.4% resolution success

        emit(f"INSERT OR REPLACE INTO ai_runs (id, chatbot_id, prompt_tokens, completion_tokens, cost_cents, latency_ms, model, status, created_at, updated_at)")
        emit(f"VALUES ({aid}, 10, {prompt}, {comp}, {cost}, {lat}, 'gpt-4o-mini', {q(stat)}, '2025-10-25 12:00:00', '2025-10-25 12:00:00');")
    emit("")

    # 18. Automations
    emit("-- 18. Active Automations")
    automations = [
        (101, "WhatsApp Instant Package & Waybill Tracking", "message_received"),
        (102, "Automated In-Chat Instant Quotation & Rate Calculator", "inquiry_received"),
        (103, "Meta API Abandoned Cart Recovery Sequence", "cart_abandoned"),
        (104, "Event-Driven Omnichannel Lead Routing (FastAPI / Redis)", "lead_qualified")
    ]
    for auto_id, name, trig in automations:
        emit(f"INSERT OR REPLACE INTO automations (id, workspace_id, name, trigger_type, status, definition_json, created_by, created_at, updated_at)")
        emit(f"VALUES ({auto_id}, 10, {q(name)}, {q(trig)}, 'active', '{{\"nodes\":[],\"edges\":[]}}', 10, '2024-01-20 10:00:00', '2024-01-20 10:00:00');")
        for r in range(1, 5):
            emit(f"INSERT OR REPLACE INTO automation_runs (id, automation_id, workspace_id, status, started_at, completed_at, created_at, updated_at)")
            emit(f"VALUES ({auto_id * 10 + r}, {auto_id}, 10, 'success', '2025-10-25 10:00:00', '2025-10-25 10:00:02', '2025-10-25 10:00:00', '2025-10-25 10:00:00');")
    emit("")

    # 19. Conversations & Messages
    emit("-- 19. Conversations & Messages (98.4% Resolution Success)")
    convos = [
        (101, 1001, "resolved", "WB-10028401", [
            ("in", "Hi, I need to track waybill #WB-10028401 shipped from Manchester to Lagos."),
            ("out", "Hello Emeka! 📦 Your shipment (Waybill #WB-10028401) cleared Lagos MMIA Customs today. Out for doorstep delivery. Arrival: Today by 3:00 PM."),
            ("in", "That was fast! Thank you so much."),
            ("out", "You are very welcome! Thanks for shipping with FTF Digital Solutions. Have a great day! ✨")
        ]),
        (102, 1002, "resolved", "WB-10028405", [
            ("in", "Hello, how much does it cost to send a 15kg commercial carton to London Heathrow?"),
            ("out", "Hi Babatunde! ✈️ Express air freight is ₦18,500 per 5kg block (Total: ₦55,500 inclusive of customs waybill). Generate instant booking link?"),
            ("in", "Yes please send the payment link."),
            ("out", "Here is your direct 1-click in-chat booking and payment link: https://botifyai.cloud/buy/ftf-logistics/order-checkout/WB-10028405.")
        ]),
        (103, 1003, "open", "WB-10028409", [
            ("in", "Good day, please confirm pickup schedule for our international diplomatic cargo."),
            ("out", "Good day Chioma! Our Abuja logistics team is scheduled for pickup at 2:00 PM today.")
        ])
    ]

    msg_id = 1000
    for conv_id, contact_id, stat, ext_th, msgs in convos:
        emit(f"INSERT OR REPLACE INTO conversations (id, uuid, workspace_id, channel_account_id, contact_id, external_thread_id, status, assigned_to, unread_count, last_message_at, last_inbound_at, created_at, updated_at)")
        emit(f"VALUES ({conv_id}, {q('conv-ftf-uuid-' + str(conv_id))}, 10, 101, {contact_id}, {q(ext_th)}, {q(stat)}, 'bot', 0, '2025-10-25 15:00:00', '2025-10-25 15:00:00', '2025-10-25 14:00:00', '2025-10-25 15:00:00');")
        for direction, body in msgs:
            msg_id += 1
            sent_by = "bot" if direction == "out" else "human"
            emit(f"INSERT OR REPLACE INTO messages (id, conversation_id, direction, channel, type, body, status, sent_by, sent_at, created_at, updated_at)")
            emit(f"VALUES ({msg_id}, {conv_id}, {q(direction)}, 'whatsapp', 'text', {q(body)}, 'delivered', {q(sent_by)}, '2025-10-25 14:30:00', '2025-10-25 14:30:00', '2025-10-25 14:30:00');")
    emit("")

    # Write output to SQL file
    output_path = os.path.abspath("database/data/ftf_digital_solutions_seed.sql")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines) + "\n")
    print(f"Generated SQL file at: {output_path}")

    # Now create database/database.sqlite with full schema and apply SQL
    db_path = os.path.abspath("database/database.sqlite")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Create tables if not exist
    ddl = """
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        logo_path VARCHAR(255),
        logo_disk VARCHAR(255) DEFAULT 'public',
        primary_color VARCHAR(7),
        custom_domain VARCHAR(255),
        tagline VARCHAR(255),
        support_email VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(64),
        address TEXT,
        status VARCHAR(32) DEFAULT 'active',
        base_currency VARCHAR(10) DEFAULT 'USD',
        currency_symbol VARCHAR(16) DEFAULT '$',
        currency_position VARCHAR(32) DEFAULT 'before',
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        workspace_id INTEGER,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(32) DEFAULT 'client',
        status VARCHAR(32) DEFAULT 'active',
        client_role VARCHAR(32),
        email_verified_at DATETIME,
        password VARCHAR(255) NOT NULL,
        two_factor_secret TEXT,
        two_factor_recovery_codes TEXT,
        two_factor_confirmed_at DATETIME,
        locale VARCHAR(10),
        display_currency VARCHAR(10),
        theme VARCHAR(16) DEFAULT 'light',
        timezone VARCHAR(64) DEFAULT 'UTC',
        remember_token VARCHAR(100),
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        client_id INTEGER,
        name VARCHAR(255) NOT NULL,
        default_locale VARCHAR(10) DEFAULT 'en',
        currency_code VARCHAR(10),
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS workspace_user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role VARCHAR(32) DEFAULT 'member',
        created_at DATETIME,
        updated_at DATETIME,
        UNIQUE(workspace_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        price_cents INTEGER DEFAULT 0,
        currency VARCHAR(8) DEFAULT 'USD',
        billing_interval VARCHAR(16) DEFAULT 'month',
        features TEXT,
        limits TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS client_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        plan_id INTEGER NOT NULL,
        billing_cycle VARCHAR(16) NOT NULL,
        starts_at DATETIME,
        ends_at DATETIME,
        status VARCHAR(32) DEFAULT 'active',
        assigned_by_admin_id INTEGER,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS channel_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        channel VARCHAR(32) NOT NULL,
        provider VARCHAR(64),
        credentials TEXT,
        display_name VARCHAR(128) NOT NULL,
        phone_number_id VARCHAR(64),
        business_account_id VARCHAR(64),
        status VARCHAR(32) DEFAULT 'inactive',
        meta_json TEXT,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS whatsapp_business_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        waba_id VARCHAR(64) UNIQUE NOT NULL,
        credentials TEXT,
        webhook_verify_token VARCHAR(512),
        status VARCHAR(32) DEFAULT 'inactive',
        meta_json TEXT,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS whatsapp_phone_numbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        waba_id_fk INTEGER NOT NULL,
        phone_number_id VARCHAR(64) UNIQUE NOT NULL,
        display_phone VARCHAR(32),
        verified_name VARCHAR(128),
        quality_rating VARCHAR(32),
        messaging_limit_tier VARCHAR(64),
        code_verification_status VARCHAR(64),
        name_status VARCHAR(64),
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS whatsapp_auto_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        channel_account_id INTEGER,
        trigger_type VARCHAR(32) DEFAULT 'keyword',
        keyword VARCHAR(128),
        match_type VARCHAR(32) DEFAULT 'exact',
        name VARCHAR(128) NOT NULL,
        reply_text TEXT NOT NULL,
        media_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ecommerce_stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        platform VARCHAR(20) NOT NULL,
        name VARCHAR(255),
        slug VARCHAR(128) UNIQUE,
        domain VARCHAR(255) NOT NULL,
        currency VARCHAR(8) DEFAULT 'USD',
        support_email VARCHAR(255),
        support_phone VARCHAR(40),
        brand_color VARCHAR(16) DEFAULT '#0D9488',
        credentials TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        is_published INTEGER DEFAULT 1,
        marketing_pixels TEXT,
        published_at DATETIME,
        external_meta TEXT,
        webhook_secret VARCHAR(64),
        last_tested_at DATETIME,
        last_test_status VARCHAR(20) DEFAULT 'untested',
        last_test_message VARCHAR(512),
        customers_synced_at DATETIME,
        orders_synced_at DATETIME,
        created_at DATETIME,
        updated_at DATETIME,
        UNIQUE(workspace_id, platform, domain)
    );

    CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        bank_name VARCHAR(128) NOT NULL,
        account_number VARCHAR(64) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        currency VARCHAR(8) DEFAULT 'NGN',
        is_verified INTEGER DEFAULT 1,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ecommerce_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        workspace_id INTEGER NOT NULL,
        external_id VARCHAR(64),
        platform VARCHAR(20) NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(191) UNIQUE,
        sku VARCHAR(64),
        price DECIMAL(12,2) DEFAULT 0,
        compare_at_price DECIMAL(12,2),
        currency VARCHAR(8) DEFAULT 'USD',
        product_type VARCHAR(32) DEFAULT 'digital',
        description TEXT,
        inventory_quantity INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        is_published INTEGER DEFAULT 1,
        image_url VARCHAR(1024),
        raw TEXT,
        custom_fields TEXT,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ecommerce_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid VARCHAR(64) UNIQUE,
        workspace_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        contact_id INTEGER,
        external_order_id VARCHAR(255) NOT NULL,
        platform VARCHAR(20) NOT NULL,
        number VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(40),
        status VARCHAR(40),
        financial_status VARCHAR(40),
        payment_status VARCHAR(40),
        fulfillment_status VARCHAR(40),
        currency VARCHAR(8),
        total DECIMAL(12,2) DEFAULT 0,
        platform_fee_cents INTEGER DEFAULT 0,
        merchant_net_cents INTEGER DEFAULT 0,
        payment_gateway VARCHAR(32),
        payment_reference VARCHAR(128),
        line_items TEXT,
        tracking_url VARCHAR(512),
        tracking_number VARCHAR(255),
        placed_at DATETIME,
        paid_at DATETIME,
        raw TEXT,
        created_at DATETIME,
        updated_at DATETIME,
        UNIQUE(store_id, external_order_id)
    );

    CREATE TABLE IF NOT EXISTS ecommerce_carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        contact_id INTEGER,
        external_id VARCHAR(255) NOT NULL,
        total DECIMAL(12,2) DEFAULT 0,
        currency VARCHAR(8),
        line_items TEXT,
        recovery_url VARCHAR(1024),
        abandoned_at DATETIME,
        recovered_at DATETIME,
        recovery_triggered_at DATETIME,
        created_at DATETIME,
        updated_at DATETIME,
        UNIQUE(store_id, external_id)
    );

    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid VARCHAR(64) UNIQUE NOT NULL,
        workspace_id INTEGER NOT NULL,
        phone_e164 VARCHAR(20),
        email VARCHAR(191),
        first_name VARCHAR(128),
        last_name VARCHAR(128),
        avatar VARCHAR(512),
        country VARCHAR(4),
        language VARCHAR(8),
        opt_in_whatsapp INTEGER DEFAULT 0,
        opt_in_sms INTEGER DEFAULT 0,
        opt_in_email INTEGER DEFAULT 1,
        custom_fields TEXT,
        last_seen_at DATETIME,
        source VARCHAR(64),
        lead_id INTEGER,
        created_at DATETIME,
        updated_at DATETIME,
        deleted_at DATETIME,
        UNIQUE(workspace_id, phone_e164)
    );

    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid VARCHAR(64) UNIQUE NOT NULL,
        workspace_id INTEGER NOT NULL,
        channel_account_id INTEGER,
        contact_id INTEGER NOT NULL,
        external_thread_id VARCHAR(128),
        status VARCHAR(16) DEFAULT 'open',
        assigned_user_id INTEGER,
        assigned_to VARCHAR(16) DEFAULT 'bot',
        handover_at DATETIME,
        last_message_at DATETIME,
        first_response_at DATETIME,
        resolved_at DATETIME,
        last_inbound_at DATETIME,
        unread_count INTEGER DEFAULT 0,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        direction VARCHAR(8) NOT NULL,
        channel VARCHAR(32) NOT NULL,
        type VARCHAR(32) DEFAULT 'text',
        payload TEXT,
        body TEXT,
        media_id INTEGER,
        status VARCHAR(16) DEFAULT 'queued',
        provider_message_id VARCHAR(128),
        error_json TEXT,
        sent_by VARCHAR(16) DEFAULT 'human',
        user_id INTEGER,
        sent_at DATETIME,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid VARCHAR(64) UNIQUE NOT NULL,
        workspace_id INTEGER NOT NULL,
        name VARCHAR(128) NOT NULL,
        channel VARCHAR(16) NOT NULL,
        whatsapp_phone_number_id VARCHAR(64),
        audience_type VARCHAR(32) DEFAULT 'segment',
        audience_ref VARCHAR(256),
        template_ref TEXT,
        payload_json TEXT,
        schedule_at DATETIME,
        timezone VARCHAR(64),
        status VARCHAR(16) DEFAULT 'draft',
        totals_json TEXT,
        created_by INTEGER,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS campaign_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        contact_id INTEGER NOT NULL,
        status VARCHAR(16) DEFAULT 'queued',
        provider_message_id VARCHAR(128),
        tracking_token VARCHAR(64),
        unsubscribe_token VARCHAR(64),
        sent_at DATETIME,
        delivered_at DATETIME,
        read_at DATETIME,
        clicked_at DATETIME,
        opted_out_at DATETIME,
        failed_reason VARCHAR(512),
        created_at DATETIME,
        updated_at DATETIME,
        UNIQUE(campaign_id, contact_id)
    );

    CREATE TABLE IF NOT EXISTS usage_meters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        metric VARCHAR(64) NOT NULL,
        period INTEGER NOT NULL,
        value INTEGER DEFAULT 0,
        created_at DATETIME,
        updated_at DATETIME,
        UNIQUE(workspace_id, metric, period)
    );

    CREATE TABLE IF NOT EXISTS ai_provider_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        provider VARCHAR(64) NOT NULL,
        default_model_chat VARCHAR(64),
        default_model_embed VARCHAR(64),
        credentials TEXT,
        enabled INTEGER DEFAULT 1,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ai_knowledge_bases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        name VARCHAR(128) NOT NULL,
        embedding_model VARCHAR(64),
        dimensions INTEGER DEFAULT 1536,
        status VARCHAR(32) DEFAULT 'active',
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ai_kb_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kb_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        source_type VARCHAR(32),
        source_ref VARCHAR(255),
        status VARCHAR(32) DEFAULT 'indexed',
        tokens INTEGER DEFAULT 0,
        last_indexed_at DATETIME,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ai_kb_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kb_id INTEGER NOT NULL,
        document_id INTEGER NOT NULL,
        ord INTEGER NOT NULL,
        content TEXT NOT NULL,
        tokens INTEGER DEFAULT 0,
        embedding TEXT,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ai_chatbots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        ai_kb_id INTEGER,
        name VARCHAR(128) NOT NULL,
        system_prompt TEXT NOT NULL,
        tone VARCHAR(32) DEFAULT 'friendly',
        max_context_chunks INTEGER DEFAULT 5,
        fallback_reply TEXT,
        channels TEXT,
        enabled INTEGER DEFAULT 1,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS ai_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chatbot_id INTEGER,
        conversation_id INTEGER,
        prompt_tokens INTEGER DEFAULT 0,
        completion_tokens INTEGER DEFAULT 0,
        cost_cents INTEGER DEFAULT 0,
        latency_ms INTEGER DEFAULT 0,
        model VARCHAR(64),
        status VARCHAR(32) DEFAULT 'ok',
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS automations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        name VARCHAR(128) NOT NULL,
        trigger_type VARCHAR(64) NOT NULL,
        status VARCHAR(32) DEFAULT 'draft',
        definition_json TEXT,
        created_by INTEGER,
        created_at DATETIME,
        updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS automation_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        automation_id INTEGER NOT NULL,
        workspace_id INTEGER NOT NULL,
        status VARCHAR(32) DEFAULT 'running',
        started_at DATETIME,
        completed_at DATETIME,
        error_message TEXT,
        created_at DATETIME,
        updated_at DATETIME
    );
    """
    cur.executescript(ddl)

    # Insert default Enterprise Plan if not exists
    cur.execute("INSERT OR REPLACE INTO plans (id, name, slug, description, price_cents, currency, billing_interval, is_active) VALUES (1, 'Enterprise Plan', 'enterprise', 'Enterprise scale multi-channel AI commerce', 99000, 'USD', 'month', 1);")

    # Now execute all SQL statements from sql_lines
    clean_sql = "\n".join(sql_lines)
    cur.executescript(clean_sql)
    conn.commit()
    conn.close()
    print("Database SQLite initialized and populated successfully.")

if __name__ == "__main__":
    main()
