import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import SeoHead from '@/Components/SeoHead';
import {
    Sparkles, ArrowRight, Video, Play, BookOpen,
    Users, Award, CheckCircle2, ChevronDown, Check,
    Layers, Smartphone, ShieldCheck, Zap, Monitor,
    GraduationCap, Clock, MessageSquare, Lock
} from 'lucide-react';

export default function CoursesLanding({ canRegister = true, landing = {} }) {
    const [openFaq, setOpenFaq] = useState(null);
    const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

    const COURSE_FEATURES = [
        {
            icon: Layers,
            title: "Structured Curriculum Builder",
            desc: "Organize your knowledge into progressive modules and lessons. Add video lectures, rich text notes, downloadable worksheets, and code snippets."
        },
        {
            icon: Video,
            title: "Flexible Video Hosting & Embeds",
            desc: "Stream your video lessons seamlessly. Embed from Bunny.net, YouTube (unlisted), Vimeo, or private custom video URLs without expensive player fees."
        },
        {
            icon: Users,
            title: "Zero Student Limits or Seat Caps",
            desc: "Teach 50 students or 50,000 students without paying exorbitant tier upgrades. You never pay per-seat penalties on BotifyAI."
        },
        {
            icon: Smartphone,
            title: "Instant WhatsApp Onboarding",
            desc: "The moment a student purchases, BotifyAI automatically sends their course access credentials and magic login link directly to their WhatsApp."
        },
        {
            icon: Award,
            title: "Student Progress & Completion",
            desc: "Students can mark lessons complete, track their learning percentage, and resume right where they left off across desktop and mobile."
        },
        {
            icon: MessageSquare,
            title: "In-Chat AI Teaching Assistant",
            desc: "Ground an AI agent on your course syllabus. Let it handle student clarification questions in WhatsApp and Instagram 24/7."
        }
    ];

    const CURRICULUM_SAMPLE = [
        {
            module: "Module 01: Foundations & Architecture",
            lessons: [
                { title: "1.1 Introduction to the Operating System", duration: "12 min", active: true },
                { title: "1.2 Setting Up Your Production Environment", duration: "18 min" },
                { title: "1.3 Core Configuration & Security Protocols", duration: "15 min" },
            ]
        },
        {
            module: "Module 02: Launching Your Digital Offerings",
            lessons: [
                { title: "2.1 Vault Packaging & Tokenized Downloads", duration: "22 min" },
                { title: "2.2 Multi-Currency Payment Integrations", duration: "14 min" },
                { title: "2.3 High-Converting In-Chat Sales Funnels", duration: "29 min" },
            ]
        },
        {
            module: "Module 03: Scaling with Autonomous AI Reps",
            lessons: [
                { title: "3.1 Grounding Your AI on Syllabus Documents", duration: "25 min" },
                { title: "3.2 Automated WhatsApp Objections & Closers", duration: "31 min" },
            ]
        }
    ];

    const FAQS = [
        {
            q: "How does Botify Academy compare to Teachable, Kajabi, or Thinkific?",
            a: "Teachable and Kajabi charge between $150 to $399 per month plus transaction fees, yet they lack in-chat conversational sales tools. BotifyAI gives you the complete course learning environment PLUS autonomous 24/7 AI agents that close enrollments on WhatsApp and Instagram, all for a fraction of the cost with 0% platform tax on Pro."
        },
        {
            q: "Where do I host my course video files?",
            a: "You can embed videos from any secure host, including Bunny.net Stream, Vimeo, Wistia, or unlisted YouTube videos. This keeps your costs ultra-low and allows lightning-fast worldwide CDN playback."
        },
        {
            q: "Can students access the courses on mobile devices?",
            a: "Yes! Botify Academy is 100% responsive, optimized for smartphones, tablets, and desktops, allowing students to learn anywhere."
        },
        {
            q: "How do students get their login details after purchase?",
            a: "Upon checkout confirmation, the system creates a student account and instantly sends the credentials and one-click magic login link via WhatsApp and email."
        },
        {
            q: "Can I sell course access bundled with downloadable materials?",
            a: "Yes! Lessons support downloadable attachments (PDFs, templates, code files, spreadsheets) so students get both video lectures and hands-on assets."
        }
    ];

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: 'Botify Academy Course Platform',
            description: 'The creator-first course platform. Host video curriculums, track student progress, and automate enrollment onboarding via WhatsApp with zero student seat fees.',
            provider: {
                '@type': 'Organization',
                name: 'BotifyAI',
                sameAs: 'https://botifyai.cloud',
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.a,
                },
            })),
        },
    ];

    return (
        <LandingLayout>
            <SeoHead
                title="Launch Video Courses Without Student Caps | Botify Academy"
                description="The creator-first course platform. Host video curriculums, track student progress, and automate enrollment onboarding via WhatsApp with zero student seat fees."
                keywords="online course platform, host video courses, Kajabi alternative, Teachable alternative, course creation software, WhatsApp student onboarding, student progress tracking"
                jsonLd={jsonLd}
            />

            {/* HERO */}
            <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden bg-white dark:bg-neutral-950">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.2),rgba(0,0,0,0))] pointer-events-none" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold tracking-wide uppercase mb-6">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Botify Academy Course Engine
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
                        Host High-Impact Video Courses{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-brand-500">
                            Without Student Seat Caps
                        </span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
                        Build structured video curriculums, deliver student credentials via WhatsApp, and let AI close course enrollments 24/7. No $150+/month platform tax.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 group"
                            >
                                Launch Your Academy Free
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        )}
                        <Link
                            href="/creators"
                            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-white font-medium text-base border border-neutral-300 dark:border-neutral-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Explore Creator OS
                        </Link>
                    </div>

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-purple-500" />
                            <span>Unlimited enrolled students</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-purple-500" />
                            <span>Instant WhatsApp magic link delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-purple-500" />
                            <span>0% platform commission on Pro</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CURRICULUM PREVIEW MOCKUP */}
            <section className="py-16 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                            Distraction-Free Learning
                        </span>
                        <h2 className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white">
                            The Modern Academy Student Portal
                        </h2>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
                        {/* Top App Bar Mockup */}
                        <div className="bg-neutral-100 dark:bg-neutral-800/80 px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-rose-500" />
                                <div className="h-3 w-3 rounded-full bg-amber-500" />
                                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                <span className="ml-3 text-xs font-semibold text-neutral-500">Masterclass: Full-Stack SaaS Architecture</span>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                42% Completed
                            </span>
                        </div>

                        {/* Split Player View */}
                        <div className="grid lg:grid-cols-12">
                            {/* Video Player */}
                            <div className="lg:col-span-7 bg-neutral-950 p-6 flex flex-col justify-between aspect-video lg:aspect-auto">
                                <div className="relative w-full h-full min-h-[260px] sm:min-h-[340px] rounded-2xl bg-neutral-900 flex items-center justify-center border border-neutral-800 overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                    <div className="h-16 w-16 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer">
                                        <Play className="h-7 w-7 fill-current ml-1" />
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 text-white text-left">
                                        <p className="text-xs text-purple-400 font-bold uppercase">Now Playing</p>
                                        <h4 className="text-base font-bold">1.1 Introduction to the Operating System</h4>
                                    </div>
                                </div>
                            </div>

                            {/* Syllabus Sidebar */}
                            <div className="lg:col-span-5 p-6 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 overflow-y-auto max-h-[460px]">
                                <h4 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-purple-500" /> Course Syllabus
                                </h4>
                                <div className="space-y-4">
                                    {CURRICULUM_SAMPLE.map((mod, i) => (
                                        <div key={i} className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3">
                                            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">{mod.module}</p>
                                            <div className="space-y-1.5">
                                                {mod.lessons.map((les, j) => (
                                                    <div
                                                        key={j}
                                                        className={`flex items-center justify-between text-xs p-2 rounded-lg ${les.active ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                                                    >
                                                        <span className="truncate pr-2">{les.title}</span>
                                                        <span className="text-[10px] text-neutral-400 whitespace-nowrap">{les.duration}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-20 bg-white dark:bg-neutral-950">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                            Engine Capabilities
                        </span>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
                            Everything You Need to Run a World-Class Academy
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {COURSE_FEATURES.map((feat, idx) => {
                            const Icon = feat.icon;
                            return (
                                <div
                                    key={idx}
                                    className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-5">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                                        {feat.title}
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        {feat.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FAQS */}
            <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                            Course Creator FAQs
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {FAQS.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full py-4 px-6 text-left flex justify-between items-center font-bold text-neutral-900 dark:text-white text-base hover:text-purple-500 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-neutral-400 transition-transform ${openFaq === idx ? 'rotate-180 text-purple-500' : ''}`}
                                    />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-6 pb-5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/50 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                        Start Teaching & Monetizing Your Expertise
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-purple-100 max-w-xl mx-auto">
                        Launch your curriculum, invite your first student, and let BotifyAI handle student delivery and support.
                    </p>
                    <div className="mt-8 flex justify-center">
                        {canRegister && (
                            <Link
                                href="/register"
                                className="px-8 py-4 rounded-full bg-white text-purple-700 hover:bg-neutral-100 font-bold text-base shadow-xl transition-all flex items-center gap-2 group"
                            >
                                Build Your Course for Free
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}

